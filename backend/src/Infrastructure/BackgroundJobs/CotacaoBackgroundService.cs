using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Infrastructure.Services;

namespace InvestirGo.API.Infrastructure.BackgroundJobs;

public sealed class CotacaoBackgroundService : BackgroundService
{
    private static readonly TimeZoneInfo SaoPauloTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CotacaoBackgroundService> _logger;

    public CotacaoBackgroundService(IServiceProvider serviceProvider, ILogger<CotacaoBackgroundService> logger)
    { _serviceProvider = serviceProvider; _logger = logger; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var primeiraExecucao = true;
        while (!stoppingToken.IsCancellationRequested)
        {
            var agora = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, SaoPauloTimeZone);
            if (!primeiraExecucao && !MercadoEmHorarioDeAtualizacao(agora))
            {
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                continue;
            }
            primeiraExecucao = false;
            await AtualizarTodosAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }

    private async Task AtualizarTodosAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var ativoRepo = scope.ServiceProvider.GetRequiredService<IAtivoRepository>();
        var marketData = scope.ServiceProvider.GetRequiredService<MarketDataService>();
        var ativos = (await ativoRepo.ObterTodosAsync()).ToList();
        var atualizados = 0;
        foreach (var ativo in ativos)
        {
            try
            {
                var cotacao = await marketData.ObterDadosCompletosAsync(ativo.Ticker, cancellationToken);
                if (cotacao.RegularMarketPrice <= 0) continue;
                var variacao = cotacao.RegularMarketChangePercent;
                if (variacao == 0 && cotacao.RegularMarketOpen > 0)
                    variacao = (cotacao.RegularMarketPrice - cotacao.RegularMarketOpen) / cotacao.RegularMarketOpen * 100m;
                if (await ativoRepo.AtualizarCotacaoAsync(ativo.Id, cotacao.RegularMarketPrice, Math.Round(variacao, 4), ativo.DividendYield))
                    atualizados++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            { _logger.LogWarning(ex, "Falha ao atualizar {Ticker}; valor anterior preservado.", ativo.Ticker); }
        }
        _logger.LogInformation("Cotações atualizadas: {Atualizados}/{Total} ativos.", atualizados, ativos.Count);
    }

    private static bool MercadoEmHorarioDeAtualizacao(DateTimeOffset agora) =>
        agora.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday
        && agora.TimeOfDay >= TimeSpan.FromHours(9.5)
        && agora.TimeOfDay <= TimeSpan.FromHours(19);
}
