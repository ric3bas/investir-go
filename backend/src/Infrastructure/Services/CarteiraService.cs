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

    public async Task<IEnumerable<PosicaoCarteira>> ObterPosicoesAsync(Guid? userId = null)
    {
        var todosAtivos = (await _ativoRepository.ObterTodosAsync()).ToList();
        var ativosPorTicker = todosAtivos
            .Where(a => !string.IsNullOrWhiteSpace(a.Ticker))
            .GroupBy(a => a.Ticker.Trim().ToUpper())
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var operacoes = (await _operacaoRepository.ObterTodasAsync(userId: userId))
            .OrderBy(o => o.DataOperacao)
            .ThenBy(o => o.Id)
            .ToList();

        var todosProventos = (await _proventoRepository.ObterTodosAsync(userId: userId)).ToList();
        var proventosPorTicker = todosProventos
            .Where(p => !string.IsNullOrWhiteSpace(p.Ticker))
            .GroupBy(p => p.Ticker.Trim().ToUpper())
            .ToDictionary(g => g.Key, g => g.Sum(p => p.ValorTotal), StringComparer.OrdinalIgnoreCase);

        // Agrupar e calcular preco medio e custodia por TICKER (garante fidelidade absoluta à planilha)
        var posicoesMap = new Dictionary<string, PosicaoCalculo>(StringComparer.OrdinalIgnoreCase);

        foreach (var op in operacoes)
        {
            var ticker = op.Ticker?.Trim().ToUpper();
            if (string.IsNullOrWhiteSpace(ticker)) continue;

            if (!posicoesMap.TryGetValue(ticker, out var pos))
            {
                pos = new PosicaoCalculo();
                posicoesMap[ticker] = pos;
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
                }
            }
        }

        var resultado = new List<PosicaoCarteira>();

        foreach (var (ticker, calc) in posicoesMap)
        {
            // Só exibe na carteira posições com custódia > 0 ou com lucro realizado
            if (calc.Quantidade <= 0 && calc.LucroRealizado == 0) continue;

            ativosPorTicker.TryGetValue(ticker, out var ativo);
            proventosPorTicker.TryGetValue(ticker, out var totalProventos);

            var precoAtual = (ativo?.PrecoAtual > 0) ? ativo.PrecoAtual : (calc.PrecoMedio > 0 ? calc.PrecoMedio : 10.00m);

            resultado.Add(new PosicaoCarteira
            {
                AtivoId = ativo?.Id ?? 0,
                Ticker = ticker,
                Nome = ativo?.Nome ?? ticker,
                Tipo = ativo?.Tipo ?? (ticker.EndsWith("11") ? "FII" : "Acao"),
                Setor = ativo?.Setor ?? "Outros",
                QuantidadeCustodia = calc.Quantidade,
                PrecoMedio = Math.Round(calc.PrecoMedio, 4),
                PrecoAtual = precoAtual,
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

    public async Task<ResumoCarteira> ObterResumoAsync(Guid? userId = null)
    {
        var posicoes = await ObterPosicoesAsync(userId);
        var lista = posicoes.ToList();

        var totalInvestido = lista.Sum(p => p.TotalInvestido);
        var saldoAtual = lista.Sum(p => p.SaldoAtual);
        var totalProventos = await _proventoRepository.ObterTotalProventosAsync(userId);
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
