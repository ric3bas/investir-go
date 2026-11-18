using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Infrastructure.Services;

namespace InvestirGo.API.Infrastructure.BackgroundJobs;

public class CotacaoBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CotacaoBackgroundService> _logger;

    public CotacaoBackgroundService(IServiceProvider serviceProvider, ILogger<CotacaoBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Iniciando atualização de cotações...");
            
            using (var scope = _serviceProvider.CreateScope())
            {
                var ativoRepo = scope.ServiceProvider.GetRequiredService<IAtivoRepository>();
                var marketDataService = scope.ServiceProvider.GetRequiredService<MarketDataService>();
                
                var ativos = await ativoRepo.ObterTodosAsync();
                
                foreach (var ativo in ativos)
                {
                    var novoPreco = await marketDataService.ObterCotacaoAtual(ativo.Ticker);
                    if (novoPreco > 0)
                    {
                        await ativoRepo.AtualizarCotacaoAsync(ativo.Id, novoPreco, 0, ativo.DividendYield);
                    }
                }
            }

            _logger.LogInformation("Cotações atualizadas. Aguardando 5 minutos.");
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
