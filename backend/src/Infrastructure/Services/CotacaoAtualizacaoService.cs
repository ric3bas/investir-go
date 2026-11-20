using System.Collections.Concurrent;
using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;

namespace InvestirGo.API.Infrastructure.Services;

public sealed class CotacaoAtualizacaoService(
    IAtivoRepository ativoRepository,
    MarketDataService marketData,
    ILogger<CotacaoAtualizacaoService> logger)
{
    private const int MaximoConsultasSimultaneas = 4;
    private static readonly SemaphoreSlim AtualizacaoGlobal = new(1, 1);

    public async Task<AtualizacaoCotacoesDto> AtualizarAsync(
        IEnumerable<string>? tickers = null,
        CancellationToken cancellationToken = default)
    {
        await AtualizacaoGlobal.WaitAsync(cancellationToken);
        try
        {
            var filtro = tickers?
                .Where(ticker => !string.IsNullOrWhiteSpace(ticker))
                .Select(ticker => ticker.Trim().ToUpperInvariant())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var ativos = (await ativoRepository.ObterTodosAsync())
                .Where(ativo => filtro is null || filtro.Contains(ativo.Ticker))
                .ToList();

            var atualizados = 0;
            var falhas = new ConcurrentBag<string>();

            await Parallel.ForEachAsync(
                ativos,
                new ParallelOptions
                {
                    MaxDegreeOfParallelism = MaximoConsultasSimultaneas,
                    CancellationToken = cancellationToken
                },
                async (ativo, token) =>
                {
                    try
                    {
                        var cotacao = await marketData.ObterDadosCompletosAsync(ativo.Ticker, token);
                        if (cotacao.RegularMarketPrice <= 0)
                            throw new MarketDataException("A fonte retornou um preço inválido.");

                        var variacao = cotacao.RegularMarketChangePercent;
                        if (variacao == 0 && cotacao.RegularMarketOpen > 0)
                        {
                            variacao = (cotacao.RegularMarketPrice - cotacao.RegularMarketOpen)
                                / cotacao.RegularMarketOpen * 100m;
                        }

                        var persistiu = await ativoRepository.AtualizarCotacaoAsync(
                            ativo.Id,
                            Math.Round(cotacao.RegularMarketPrice, 2),
                            Math.Round(variacao, 4),
                            ativo.DividendYield);

                        if (persistiu)
                            Interlocked.Increment(ref atualizados);
                        else
                            falhas.Add(ativo.Ticker);
                    }
                    catch (OperationCanceledException) when (token.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        falhas.Add(ativo.Ticker);
                        logger.LogWarning(ex, "Falha ao atualizar {Ticker}; valor anterior preservado.", ativo.Ticker);
                    }
                });

            var resultado = new AtualizacaoCotacoesDto(
                ativos.Count,
                atualizados,
                falhas.OrderBy(ticker => ticker).ToArray(),
                DateTimeOffset.UtcNow);

            logger.LogInformation(
                "Cotações consultadas sob demanda: {Atualizados}/{Total}; falhas: {Falhas}.",
                resultado.Atualizados,
                resultado.TotalConsultados,
                resultado.Falhas.Count);

            return resultado;
        }
        finally
        {
            AtualizacaoGlobal.Release();
        }
    }
}
