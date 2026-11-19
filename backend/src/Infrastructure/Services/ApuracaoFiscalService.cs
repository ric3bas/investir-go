using System.Globalization;
using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Infrastructure.Services;

/// <summary>
/// Memória de cálculo fiscal baseada exclusivamente nos lançamentos do usuário.
/// Não substitui a apuração oficial da Receita Federal/ReVar nem a nota de corretagem.
/// </summary>
public sealed class ApuracaoFiscalService(IOperacaoRepository operacaoRepository) : IApuracaoFiscalService
{
    private const decimal LimiteIsencao = 20_000m;
    private const decimal AliquotaComum = 0.15m;
    private const decimal AliquotaFiiFiagro = 0.20m;
    private const decimal AliquotaDayTrade = 0.20m;
    private const decimal AliquotaIrrfComum = 0.00005m;
    private const decimal AliquotaIrrfDayTrade = 0.01m;
    private const decimal ValorMinimoDarf = 10m;

    public async Task<ApuracaoFiscalResponseDto> CalcularAsync(Guid userId, int ano)
    {
        if (ano is < 2000 or > 2100)
            throw new ArgumentOutOfRangeException(nameof(ano), "Ano de apuração inválido.");

        var operacoes = (await operacaoRepository.ObterTodasAsync(userId: userId))
            .Where(o => o.Quantidade > 0 && o.PrecoUnitario > 0)
            .OrderBy(o => o.DataOperacao.Date)
            .ThenBy(o => o.Id)
            .ToList();

        var alertas = new HashSet<string>();
        var mesesBrutos = new Dictionary<(int Ano, int Mes), MesBruto>();
        var custodia = new Dictionary<string, PosicaoFiscal>(StringComparer.OrdinalIgnoreCase);

        foreach (var grupoDiaAtivo in operacoes.GroupBy(o => new
                 {
                     Data = o.DataOperacao.Date,
                     Ticker = o.Ticker.Trim().ToUpperInvariant()
                 }).OrderBy(g => g.Key.Data).ThenBy(g => g.Key.Ticker))
        {
            ProcessarDiaAtivo(grupoDiaAtivo.ToList(), custodia, mesesBrutos, alertas);
        }

        alertas.Add("O IRRF é estimado porque o cadastro não possui o valor efetivamente retido na nota de corretagem. Confirme o valor real antes de pagar.");
        alertas.Add("O vencimento considera o último dia útil bancário do mês seguinte, sem calendário local de feriados. Confirme no Sicalc ou no ReVar.");
        alertas.Add("A apuração considera somente as operações registradas no InvestirGo. Custos iniciais e prejuízos anteriores devem ser informados no ReVar.");

        var primeiroAno = operacoes.Count > 0 ? Math.Min(operacoes.Min(o => o.DataOperacao.Year), ano) : ano;
        var avaliados = AvaliarMeses(primeiroAno, ano, mesesBrutos);

        return new ApuracaoFiscalResponseDto(
            ano,
            DateTime.UtcNow,
            "6015",
            "Operações comuns, day trade e grupo FII/Fiagro do usuário autenticado",
            RegraFiscal.Todas.Select(r => new MatrizFiscalClasseDto(
                r.Codigo, r.Rotulo, r.AliquotaComum, r.AliquotaDayTrade,
                r.Isencao, r.GrupoPrejuizo, r.Calculavel)).ToList(),
            avaliados.Where(m => m.Ano == ano).ToList(),
            alertas.OrderBy(a => a).ToList());
    }

    private static void ProcessarDiaAtivo(
        List<Operacao> operacoes,
        Dictionary<string, PosicaoFiscal> custodia,
        Dictionary<(int Ano, int Mes), MesBruto> meses,
        HashSet<string> alertas)
    {
        var ticker = operacoes[0].Ticker.Trim().ToUpperInvariant();
        var regra = RegraFiscal.Obter(operacoes[0].TipoAtivo);
        var data = operacoes[0].DataOperacao.Date;
        var mes = ObterMes(meses, data.Year, data.Month);
        var classe = mes.ObterClasse(regra.Codigo);
        var detalhe = mes.ObterAtivo(operacoes[0].AtivoId, ticker, operacoes[0].TipoAtivo, regra.Codigo, regra.Calculavel);

        if (!regra.Calculavel)
            alertas.Add($"{ticker}: classe fiscal não reconhecida (OTHER). O resultado aparece para revisão, mas não entra no DARF.");
        if (regra.Codigo is "OPTION" or "FUTURE")
            alertas.Add($"{ticker}: confira IRRF, exercício, vencimento e ajustes na nota da corretora; esses eventos não podem ser reconstruídos integralmente apenas por compra e venda.");

        var compras = operacoes.Where(EhCompra).Select(ParcelaOperacao.Criar).ToList();
        var vendas = operacoes.Where(EhVenda).Select(ParcelaOperacao.Criar).ToList();
        var indiceCompra = 0;
        var indiceVenda = 0;
        var encontrouDayTrade = false;

        while (indiceCompra < compras.Count && indiceVenda < vendas.Count)
        {
            var compra = compras[indiceCompra];
            var venda = vendas[indiceVenda];
            var quantidade = Math.Min(compra.Restante, venda.Restante);
            if (quantidade <= 0) break;

            var custo = quantidade * (compra.Operacao.PrecoUnitario + compra.TaxaUnitaria);
            var receita = quantidade * (venda.Operacao.PrecoUnitario - venda.TaxaUnitaria);
            var resultado = receita - custo;
            var vendaBruta = quantidade * venda.Operacao.PrecoUnitario;

            classe.VendasDayTrade += vendaBruta;
            classe.ResultadoDayTrade += resultado;
            detalhe.QuantidadeVendida += quantidade;
            detalhe.TotalVendas += vendaBruta;
            detalhe.ResultadoDayTrade += resultado;
            encontrouDayTrade = true;

            compra.Restante -= quantidade;
            venda.Restante -= quantidade;
            if (compra.Restante == 0) indiceCompra++;
            if (venda.Restante == 0) indiceVenda++;
        }

        if (encontrouDayTrade)
            alertas.Add("Compras e vendas do mesmo ticker no mesmo dia foram tratadas como day trade; confirme se ocorreram na mesma corretora.");

        var restantes = compras.Concat(vendas)
            .Where(p => p.Restante > 0)
            .OrderBy(p => p.Operacao.Id)
            .ToList();

        if (!custodia.TryGetValue(ticker, out var posicao))
        {
            posicao = new PosicaoFiscal();
            custodia[ticker] = posicao;
        }

        foreach (var parcela in restantes)
        {
            var quantidade = parcela.Restante;
            if (EhCompra(parcela.Operacao))
            {
                var custoCompra = quantidade * (parcela.Operacao.PrecoUnitario + parcela.TaxaUnitaria);
                var custoAnterior = posicao.Quantidade * posicao.PrecoMedio;
                posicao.Quantidade += quantidade;
                posicao.PrecoMedio = posicao.Quantidade == 0 ? 0 : (custoAnterior + custoCompra) / posicao.Quantidade;
                continue;
            }

            var quantidadeCalculavel = Math.Min(quantidade, posicao.Quantidade);
            if (quantidadeCalculavel < quantidade)
                alertas.Add($"{ticker}: existe venda sem custódia de compra suficiente. A parcela sem custo conhecido foi excluída do lucro tributável.");

            var vendaBruta = quantidade * parcela.Operacao.PrecoUnitario;
            var receitaCalculavel = quantidadeCalculavel * (parcela.Operacao.PrecoUnitario - parcela.TaxaUnitaria);
            var custoCalculavel = quantidadeCalculavel * posicao.PrecoMedio;
            var resultado = receitaCalculavel - custoCalculavel;

            classe.VendasComuns += vendaBruta;
            classe.ResultadoComum += resultado;
            detalhe.QuantidadeVendida += quantidade;
            detalhe.TotalVendas += vendaBruta;
            detalhe.ResultadoComum += resultado;

            posicao.Quantidade -= quantidadeCalculavel;
            if (posicao.Quantidade == 0) posicao.PrecoMedio = 0;
        }
    }

    private static List<ApuracaoFiscalMensalDto> AvaliarMeses(
        int primeiroAno,
        int ultimoAno,
        Dictionary<(int Ano, int Mes), MesBruto> mesesBrutos)
    {
        var resultado = new List<ApuracaoFiscalMensalDto>();
        decimal prejuizoComum = 0;
        decimal prejuizoFiiFiagro = 0;
        decimal prejuizoDayTrade = 0;
        decimal creditoIrrfComum = 0;
        decimal creditoIrrfDayTrade = 0;
        decimal saldoAbaixoMinimo = 0;

        for (var ano = primeiroAno; ano <= ultimoAno; ano++)
        {
            creditoIrrfComum = 0;
            creditoIrrfDayTrade = 0;

            for (var mesNumero = 1; mesNumero <= 12; mesNumero++)
            {
                var bruto = mesesBrutos.GetValueOrDefault((ano, mesNumero)) ?? new MesBruto();
                var acoes = bruto.ObterClasse("BR_STOCK_SPOT");
                var ouro = bruto.ObterClasse("GOLD");
                var acoesIsentas = acoes.VendasComuns <= LimiteIsencao;
                var ouroIsento = ouro.VendasComuns <= LimiteIsencao;
                var resultadoIsentoAcoes = acoesIsentas && acoes.ResultadoComum > 0 ? acoes.ResultadoComum : 0;
                var resultadoIsentoOuro = ouroIsento && ouro.ResultadoComum > 0 ? ouro.ResultadoComum : 0;

                var resultadoComumTributavel = bruto.Classes
                    .Where(par => RegraFiscal.ObterPorCodigo(par.Key) is { Calculavel: true, Grupo: GrupoTributacao.Geral })
                    .Sum(par => ResultadoComumTributavel(par.Key, par.Value, acoesIsentas, ouroIsento));
                var resultadoDayTradeTributavel = bruto.Classes
                    .Where(par => RegraFiscal.ObterPorCodigo(par.Key) is { Calculavel: true, Grupo: GrupoTributacao.Geral })
                    .Sum(par => par.Value.ResultadoDayTrade);
                var resultadoFiiFiagro = bruto.Classes
                    .Where(par => RegraFiscal.ObterPorCodigo(par.Key).Grupo == GrupoTributacao.FiiFiagro)
                    .Sum(par => par.Value.ResultadoComum + par.Value.ResultadoDayTrade);

                var (baseComum, compensadoComum, novoPrejuizoComum) = AplicarPrejuizo(resultadoComumTributavel, prejuizoComum);
                prejuizoComum = novoPrejuizoComum;
                var (baseFii, compensadoFii, novoPrejuizoFii) = AplicarPrejuizo(resultadoFiiFiagro, prejuizoFiiFiagro);
                prejuizoFiiFiagro = novoPrejuizoFii;
                var (baseDayTrade, compensadoDayTrade, novoPrejuizoDayTrade) = AplicarPrejuizo(resultadoDayTradeTributavel, prejuizoDayTrade);
                prejuizoDayTrade = novoPrejuizoDayTrade;

                var vendasElegiveisIrrfComum = bruto.Classes
                    .Where(par => RegraFiscal.ObterPorCodigo(par.Key) is { Calculavel: true } regra && regra.Codigo is not ("OPTION" or "FUTURE"))
                    .Sum(par => par.Value.VendasComuns);
                var irrfComumMes = Arredondar(vendasElegiveisIrrfComum * AliquotaIrrfComum);
                if (irrfComumMes <= 1m) irrfComumMes = 0;
                var resultadoDayTradeTotal = bruto.Classes
                    .Where(par => RegraFiscal.ObterPorCodigo(par.Key).Calculavel)
                    .Sum(par => par.Value.ResultadoDayTrade);
                var irrfDayTradeMes = Math.Max(0, resultadoDayTradeTotal) * AliquotaIrrfDayTrade;
                creditoIrrfComum += irrfComumMes;
                creditoIrrfDayTrade += irrfDayTradeMes;

                var impostoGeralComum = baseComum * AliquotaComum;
                var impostoFiiFiagro = baseFii * AliquotaFiiFiagro;
                var impostoDayTrade = baseDayTrade * AliquotaDayTrade;
                var usadoComum = Math.Min(impostoGeralComum + impostoFiiFiagro, creditoIrrfComum);
                var creditoComumUsadoNoFii = Math.Max(0, usadoComum - impostoGeralComum);
                var impostoFiiRestante = Math.Max(0, impostoFiiFiagro - creditoComumUsadoNoFii);
                var usadoDayTrade = Math.Min(impostoDayTrade + impostoFiiRestante, creditoIrrfDayTrade);
                creditoIrrfComum -= usadoComum;
                creditoIrrfDayTrade -= usadoDayTrade;

                var impostoBruto = impostoGeralComum + impostoFiiFiagro + impostoDayTrade;
                var impostoLiquido = Math.Max(0, impostoBruto - usadoComum - usadoDayTrade);
                var saldoAnterior = saldoAbaixoMinimo;
                var totalParaDarf = saldoAbaixoMinimo + impostoLiquido;
                var darf = totalParaDarf >= ValorMinimoDarf ? totalParaDarf : 0;
                saldoAbaixoMinimo = darf > 0 ? 0 : totalParaDarf;

                var hoje = DateTime.Today;
                var competencia = new DateTime(ano, mesNumero, 1);
                var situacao = competencia > new DateTime(hoje.Year, hoje.Month, 1)
                    ? "Mês futuro"
                    : darf > 0 ? "DARF estimado"
                    : saldoAbaixoMinimo > 0 ? "Abaixo de R$ 10"
                    : impostoBruto > 0 ? "Compensado por IRRF"
                    : "Sem DARF";

                var vendasFiis = SomarGrupo(bruto, GrupoTributacao.FiiFiagro, c => c.VendasComuns);
                var vendasOutros = bruto.Classes
                    .Where(par => par.Key is not ("BR_STOCK_SPOT" or "GOLD") && RegraFiscal.ObterPorCodigo(par.Key).Grupo == GrupoTributacao.Geral)
                    .Sum(par => par.Value.VendasComuns);
                var resultadoOutros = bruto.Classes
                    .Where(par => par.Key is not ("BR_STOCK_SPOT" or "GOLD") && RegraFiscal.ObterPorCodigo(par.Key).Grupo == GrupoTributacao.Geral)
                    .Sum(par => par.Value.ResultadoComum);
                var vendasDayTrade = bruto.Classes.Values.Sum(c => c.VendasDayTrade);
                var resultadoDayTrade = bruto.Classes.Values.Sum(c => c.ResultadoDayTrade);

                resultado.Add(new ApuracaoFiscalMensalDto(
                    ano, mesNumero,
                    competencia.ToString("MMM/yyyy", new CultureInfo("pt-BR")),
                    CalcularVencimento(ano, mesNumero),
                    Arredondar(acoes.VendasComuns),
                    Arredondar(ouro.VendasComuns),
                    Arredondar(vendasOutros),
                    Arredondar(vendasFiis),
                    Arredondar(vendasDayTrade),
                    Arredondar(acoes.ResultadoComum),
                    Arredondar(resultadoIsentoAcoes),
                    Arredondar(ouro.ResultadoComum),
                    Arredondar(resultadoIsentoOuro),
                    Arredondar(resultadoOutros),
                    Arredondar(resultadoFiiFiagro),
                    Arredondar(resultadoDayTrade),
                    Arredondar(baseComum),
                    Arredondar(baseFii),
                    Arredondar(baseDayTrade),
                    Arredondar(compensadoComum),
                    Arredondar(compensadoFii),
                    Arredondar(compensadoDayTrade),
                    Arredondar(prejuizoComum),
                    Arredondar(prejuizoFiiFiagro),
                    Arredondar(prejuizoDayTrade),
                    Arredondar(irrfComumMes),
                    Arredondar(irrfDayTradeMes),
                    Arredondar(usadoComum + usadoDayTrade),
                    Arredondar(impostoBruto),
                    Arredondar(impostoLiquido),
                    Arredondar(saldoAnterior),
                    Arredondar(darf),
                    Arredondar(saldoAbaixoMinimo),
                    acoesIsentas,
                    ouroIsento,
                    darf > 0,
                    situacao,
                    RegraFiscal.Todas.Select(regra =>
                    {
                        var classe = bruto.ObterClasse(regra.Codigo);
                        return new ApuracaoFiscalClasseMensalDto(
                            regra.Codigo,
                            Arredondar(classe.VendasComuns),
                            Arredondar(classe.VendasDayTrade),
                            Arredondar(classe.ResultadoComum),
                            Arredondar(classe.ResultadoDayTrade),
                            regra.Calculavel);
                    }).ToList(),
                    bruto.Ativos.Values
                        .Where(a => a.TotalVendas != 0 || a.ResultadoComum != 0 || a.ResultadoDayTrade != 0)
                        .OrderByDescending(a => a.TotalVendas)
                        .Select(a => new ApuracaoFiscalAtivoDto(
                            a.AtivoId, a.Ticker, a.TipoAtivo, a.ClasseFiscal, a.Calculado,
                            Arredondar(a.QuantidadeVendida, 8),
                            Arredondar(a.TotalVendas),
                            Arredondar(a.ResultadoComum),
                            Arredondar(a.ResultadoDayTrade)))
                        .ToList()));
            }
        }

        return resultado;
    }

    private static decimal ResultadoComumTributavel(string codigo, ClasseBruta classe, bool acoesIsentas, bool ouroIsento)
    {
        if (codigo == "BR_STOCK_SPOT" && acoesIsentas && classe.ResultadoComum > 0) return 0;
        if (codigo == "GOLD" && ouroIsento && classe.ResultadoComum > 0) return 0;
        return classe.ResultadoComum;
    }

    private static decimal SomarGrupo(MesBruto mes, GrupoTributacao grupo, Func<ClasseBruta, decimal> seletor) =>
        mes.Classes.Where(par => RegraFiscal.ObterPorCodigo(par.Key).Grupo == grupo).Sum(par => seletor(par.Value));

    private static (decimal Base, decimal Compensado, decimal NovoSaldo) AplicarPrejuizo(decimal resultado, decimal prejuizoAnterior)
    {
        if (resultado <= 0) return (0, 0, prejuizoAnterior + Math.Abs(resultado));
        var compensado = Math.Min(resultado, prejuizoAnterior);
        return (resultado - compensado, compensado, prejuizoAnterior - compensado);
    }

    private static DateTime CalcularVencimento(int ano, int mes)
    {
        var seguinte = new DateTime(ano, mes, 1).AddMonths(1);
        var vencimento = new DateTime(seguinte.Year, seguinte.Month, DateTime.DaysInMonth(seguinte.Year, seguinte.Month));
        while (vencimento.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            vencimento = vencimento.AddDays(-1);
        return vencimento;
    }

    private static MesBruto ObterMes(Dictionary<(int Ano, int Mes), MesBruto> meses, int ano, int mes)
    {
        if (!meses.TryGetValue((ano, mes), out var valor))
        {
            valor = new MesBruto();
            meses[(ano, mes)] = valor;
        }
        return valor;
    }

    private static bool EhCompra(Operacao operacao) => operacao.TipoOperacao.Equals("COMPRA", StringComparison.OrdinalIgnoreCase);
    private static bool EhVenda(Operacao operacao) => operacao.TipoOperacao.Equals("VENDA", StringComparison.OrdinalIgnoreCase);
    private static decimal Arredondar(decimal valor, int casas = 2) => Math.Round(valor, casas, MidpointRounding.AwayFromZero);

    private enum GrupoTributacao { Geral, FiiFiagro, RevisaoManual }

    private sealed record RegraFiscal(
        string Codigo,
        string Rotulo,
        decimal? AliquotaComum,
        decimal? AliquotaDayTrade,
        string Isencao,
        string GrupoPrejuizo,
        GrupoTributacao Grupo,
        bool Calculavel)
    {
        public static readonly IReadOnlyList<RegraFiscal> Todas =
        [
            new("BR_STOCK_SPOT", "Ações no mercado à vista", 15m, 20m, "Até R$ 20 mil/mês em operações comuns", "Comum ou day trade", GrupoTributacao.Geral, true),
            new("ETF", "ETF de renda variável", 15m, 20m, "Sem isenção", "Comum ou day trade", GrupoTributacao.Geral, true),
            new("BDR", "Brazilian Depositary Receipt", 15m, 20m, "Sem isenção", "Comum ou day trade", GrupoTributacao.Geral, true),
            new("FII", "Fundo de Investimento Imobiliário", 20m, 20m, "Sem isenção", "Grupo FII/Fiagro", GrupoTributacao.FiiFiagro, true),
            new("FIAGRO", "Fundo do Agronegócio", 20m, 20m, "Sem isenção", "Grupo FII/Fiagro", GrupoTributacao.FiiFiagro, true),
            new("OPTION", "Opções", 15m, 20m, "Sem isenção", "Comum ou day trade", GrupoTributacao.Geral, true),
            new("FUTURE", "Mercado futuro", 15m, 20m, "Sem isenção", "Comum ou day trade", GrupoTributacao.Geral, true),
            new("GOLD", "Ouro ativo financeiro", 15m, 20m, "Limite próprio de R$ 20 mil/mês", "Comum ou day trade", GrupoTributacao.Geral, true),
            new("OTHER", "Classe não identificada", null, null, "Indeterminada", "Revisão manual", GrupoTributacao.RevisaoManual, false)
        ];

        public static RegraFiscal Obter(string? tipo)
        {
            var normalizado = (tipo ?? string.Empty).Trim().ToUpperInvariant();
            var codigo = normalizado switch
            {
                "ACAO" or "AÇÃO" or "BR_STOCK_SPOT" => "BR_STOCK_SPOT",
                "ETF" => "ETF",
                "BDR" => "BDR",
                "FII" => "FII",
                "FIAGRO" => "FIAGRO",
                "OPTION" or "OPCAO" or "OPÇÃO" => "OPTION",
                "FUTURE" or "FUTURO" => "FUTURE",
                "GOLD" or "OURO" => "GOLD",
                _ => "OTHER"
            };
            return ObterPorCodigo(codigo);
        }

        public static RegraFiscal ObterPorCodigo(string codigo) =>
            Todas.FirstOrDefault(r => r.Codigo == codigo) ?? Todas[^1];
    }

    private sealed class ParcelaOperacao
    {
        private ParcelaOperacao(Operacao operacao)
        {
            Operacao = operacao;
            Restante = operacao.Quantidade;
            TaxaUnitaria = operacao.Quantidade == 0 ? 0 : operacao.Taxas / operacao.Quantidade;
        }
        public Operacao Operacao { get; }
        public decimal Restante { get; set; }
        public decimal TaxaUnitaria { get; }
        public static ParcelaOperacao Criar(Operacao operacao) => new(operacao);
    }

    private sealed class PosicaoFiscal
    {
        public decimal Quantidade { get; set; }
        public decimal PrecoMedio { get; set; }
    }

    private sealed class MesBruto
    {
        public Dictionary<string, ClasseBruta> Classes { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, AtivoBruto> Ativos { get; } = new(StringComparer.OrdinalIgnoreCase);

        public ClasseBruta ObterClasse(string codigo)
        {
            if (!Classes.TryGetValue(codigo, out var classe))
            {
                classe = new ClasseBruta();
                Classes[codigo] = classe;
            }
            return classe;
        }

        public AtivoBruto ObterAtivo(int ativoId, string ticker, string tipoAtivo, string classeFiscal, bool calculado)
        {
            if (!Ativos.TryGetValue(ticker, out var ativo))
            {
                ativo = new AtivoBruto(ativoId, ticker, tipoAtivo, classeFiscal, calculado);
                Ativos[ticker] = ativo;
            }
            return ativo;
        }
    }

    private sealed class ClasseBruta
    {
        public decimal VendasComuns { get; set; }
        public decimal VendasDayTrade { get; set; }
        public decimal ResultadoComum { get; set; }
        public decimal ResultadoDayTrade { get; set; }
    }

    private sealed class AtivoBruto(int ativoId, string ticker, string tipoAtivo, string classeFiscal, bool calculado)
    {
        public int AtivoId { get; } = ativoId;
        public string Ticker { get; } = ticker;
        public string TipoAtivo { get; } = tipoAtivo;
        public string ClasseFiscal { get; } = classeFiscal;
        public bool Calculado { get; } = calculado;
        public decimal QuantidadeVendida { get; set; }
        public decimal TotalVendas { get; set; }
        public decimal ResultadoComum { get; set; }
        public decimal ResultadoDayTrade { get; set; }
    }
}
