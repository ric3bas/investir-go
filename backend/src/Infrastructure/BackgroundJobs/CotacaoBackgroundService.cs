using InvestirGo.API.Infrastructure.Services;

namespace InvestirGo.API.Infrastructure.BackgroundJobs;

public sealed class CotacaoBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CotacaoBackgroundService> _logger;

    public CotacaoBackgroundService(IServiceProvider serviceProvider, ILogger<CotacaoBackgroundService> logger)
    { _serviceProvider = serviceProvider; _logger = logger; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var primeiraExecucao = true;
        while (!stoppingToken.IsCancellationRequested)
        {
            var agora = BrazilMarketClock.Now;
            if (!primeiraExecucao && !MercadoEmHorarioDeAtualizacao(agora))
            {
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                continue;
            }
            primeiraExecucao = false;
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var cotacaoService = scope.ServiceProvider.GetRequiredService<CotacaoAtualizacaoService>();
                await cotacaoService.AtualizarAsync(cancellationToken: stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // Uma indisponibilidade transitória do banco ou da rede não deve
                // encerrar o host inteiro. A próxima rodada tentará novamente.
                _logger.LogError(ex, "Falha geral na atualização de cotações; nova tentativa em 30 minutos.");
            }
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }

    private static bool MercadoEmHorarioDeAtualizacao(DateTimeOffset agora) =>
        agora.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday
        && agora.TimeOfDay >= TimeSpan.FromHours(9.5)
        && agora.TimeOfDay <= TimeSpan.FromHours(19);
}
