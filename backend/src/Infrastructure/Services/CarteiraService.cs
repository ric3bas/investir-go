using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Infrastructure.Services;

public class CarteiraService : ICarteiraService
{
    private readonly IAtivoRepository _ativoRepository;
    private readonly IOperacaoRepository _operacaoRepository;
    private readonly IProventoRepository _proventoRepository;

    public CarteiraService(
        IAtivoRepository ativoRepository,
        IOperacaoRepository operacaoRepository,
        IProventoRepository proventoRepository)
    {
        _ativoRepository = ativoRepository;
        _operacaoRepository = operacaoRepository;
        _proventoRepository = proventoRepository;
    }

    public async Task<IEnumerable<PosicaoCarteira>> ObterPosicoesAsync()
    {
        var ativos = (await _ativoRepository.ObterTodosAsync()).ToDictionary(a => a.Id);
        var operacoes = (await _operacaoRepository.ObterTodasAsync())
            .OrderBy(o => o.DataOperacao)
            .ThenBy(o => o.Id)
            .ToList();

        var proventos = (await _proventoRepository.ObterTodosAsync())
            .GroupBy(p => p.AtivoId)
            .ToDictionary(g => g.Key, g => g.Sum(p => p.ValorTotal));

        // Agrupar e calcular preco medio e custodia por ativo
        var posicoesMap = new Dictionary<int, PosicaoCalculo>();

        foreach (var op in operacoes)
        {
            if (!posicoesMap.TryGetValue(op.AtivoId, out var pos))
            {
                pos = new PosicaoCalculo();
                posicoesMap[op.AtivoId] = pos;
            }

            if (op.TipoOperacao.Equals("COMPRA", StringComparison.OrdinalIgnoreCase))
            {
                // Regra de preco medio da B3:
                // PrecoMedio = ( (QtdAtual * PrecoMedioAtual) + (QtdCompra * PrecoUnitario) ) / (QtdAtual + QtdCompra)
                var custoAtual = pos.Quantidade * pos.PrecoMedio;
                var custoCompra = op.Quantidade * op.PrecoUnitario;
                pos.Quantidade += op.Quantidade;
                if (pos.Quantidade > 0)
                {
                    pos.PrecoMedio = (custoAtual + custoCompra) / pos.Quantidade;
                }
            }
            else if (op.TipoOperacao.Equals("VENDA", StringComparison.OrdinalIgnoreCase))
            {
                // Venda realiza lucro ou prejuizo: (PrecoVenda - PrecoMedio) * QtdVenda
                var lucro = (op.PrecoUnitario - pos.PrecoMedio) * op.Quantidade;
                pos.LucroRealizado += lucro;
                pos.Quantidade -= op.Quantidade;
                if (pos.Quantidade <= 0)
                {
                    pos.Quantidade = 0;
                    // Se zerou posicao, mantem ou zera preco medio
                }
            }
        }

        var resultado = new List<PosicaoCarteira>();

        foreach (var (ativoId, calc) in posicoesMap)
        {
            if (!ativos.TryGetValue(ativoId, out var ativo)) continue;
            
            // Só exibe na carteira posições com custódia > 0 ou com proventos/lucro realizado relevante
            if (calc.Quantidade <= 0 && calc.LucroRealizado == 0) continue;

            proventos.TryGetValue(ativoId, out var totalProventos);

            resultado.Add(new PosicaoCarteira
            {
                AtivoId = ativo.Id,
                Ticker = ativo.Ticker,
                Nome = ativo.Nome,
                Tipo = ativo.Tipo,
                Setor = ativo.Setor,
                QuantidadeCustodia = calc.Quantidade,
                PrecoMedio = Math.Round(calc.PrecoMedio, 4),
                PrecoAtual = ativo.PrecoAtual,
                TotalProventosRecebidos = totalProventos,
                LucroRealizadoVendas = Math.Round(calc.LucroRealizado, 2)
            });
        }

        // Calcular percentual da carteira
        var saldoTotalGeral = resultado.Sum(r => r.SaldoAtual);
        if (saldoTotalGeral > 0)
        {
            foreach (var pos in resultado)
            {
                pos.PercentualCarteira = Math.Round((pos.SaldoAtual / saldoTotalGeral) * 100, 2);
            }
        }

        return resultado.OrderByDescending(r => r.SaldoAtual);
    }

    public async Task<ResumoCarteira> ObterResumoAsync()
    {
        var posicoes = await ObterPosicoesAsync();
        var lista = posicoes.ToList();

        var totalInvestido = lista.Sum(p => p.TotalInvestido);
        var saldoAtual = lista.Sum(p => p.SaldoAtual);
        var totalProventos = (await _proventoRepository.ObterTotalProventosAsync());
        var lucroRealizado = lista.Sum(p => p.LucroRealizadoVendas);

        var totalAcoes = lista.Where(p => p.Tipo.Equals("Acao", StringComparison.OrdinalIgnoreCase)).Sum(p => p.SaldoAtual);
        var totalFIIs = lista.Where(p => p.Tipo.Equals("FII", StringComparison.OrdinalIgnoreCase)).Sum(p => p.SaldoAtual);

        return new ResumoCarteira
        {
            TotalInvestido = Math.Round(totalInvestido, 2),
            SaldoAtual = Math.Round(saldoAtual, 2),
            TotalProventos = Math.Round(totalProventos, 2),
            LucroRealizadoVendas = Math.Round(lucroRealizado, 2),
            QuantidadeAtivos = lista.Count(p => p.QuantidadeCustodia > 0),
            TotalAcoes = Math.Round(totalAcoes, 2),
            TotalFIIs = Math.Round(totalFIIs, 2)
        };
    }

    private class PosicaoCalculo
    {
        public decimal Quantidade { get; set; }
        public decimal PrecoMedio { get; set; }
        public decimal LucroRealizado { get; set; }
    }
}
