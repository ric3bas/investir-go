using System.Net;
using System.Text;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace InvestirGo.Tests;

public sealed class CotacaoAtualizacaoServiceTests
{
    [Fact]
    public async Task AtualizarAsync_ConsultaMercadoEPersisteSomenteCotacoesValidas()
    {
        var repository = new AtivoRepositoryFake(
        [
            new Ativo { Id = 1, Ticker = "BBAS3", PrecoAtual = 14.12m, DividendYield = 9.85m },
            new Ativo { Id = 2, Ticker = "BBDC4", PrecoAtual = 14.08m, DividendYield = 7.50m }
        ]);

        using var httpClient = new HttpClient(new CotacaoHandlerFake())
        {
            BaseAddress = new Uri("https://brapi.dev/api/")
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["MarketData:BrapiKey"] = "test-key" })
            .Build();
        var marketData = new MarketDataService(httpClient, configuration);
        var service = new CotacaoAtualizacaoService(
            repository,
            marketData,
            NullLogger<CotacaoAtualizacaoService>.Instance);

        var resultado = await service.AtualizarAsync();

        Assert.Equal(2, resultado.TotalConsultados);
        Assert.Equal(1, resultado.Atualizados);
        Assert.Equal(["BBDC4"], resultado.Falhas);
        Assert.Equal(31.42m, repository.Ativos.Single(ativo => ativo.Ticker == "BBAS3").PrecoAtual);
        Assert.Equal(14.08m, repository.Ativos.Single(ativo => ativo.Ticker == "BBDC4").PrecoAtual);
    }

    private sealed class CotacaoHandlerFake : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsolutePath.EndsWith("/BBAS3", StringComparison.Ordinal) == true)
            {
                const string json = """
                    {"results":[{"symbol":"BBAS3","regularMarketPrice":31.42,"regularMarketOpen":31.10,"regularMarketChangePercent":1.0289}]}
                    """;
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
            {
                Content = new StringContent("fonte temporariamente indisponível")
            });
        }
    }

    private sealed class AtivoRepositoryFake(IEnumerable<Ativo> ativos) : IAtivoRepository
    {
        public List<Ativo> Ativos { get; } = ativos.ToList();

        public Task<IEnumerable<Ativo>> ObterTodosAsync() =>
            Task.FromResult<IEnumerable<Ativo>>(Ativos);

        public Task<Ativo?> ObterPorIdAsync(int id) =>
            Task.FromResult(Ativos.SingleOrDefault(ativo => ativo.Id == id));

        public Task<Ativo?> ObterPorTickerAsync(string ticker) =>
            Task.FromResult(Ativos.SingleOrDefault(ativo => ativo.Ticker.Equals(ticker, StringComparison.OrdinalIgnoreCase)));

        public Task<int> CriarAsync(Ativo ativo)
        {
            Ativos.Add(ativo);
            return Task.FromResult(ativo.Id);
        }

        public Task<bool> AtualizarCotacaoAsync(
            int id,
            decimal precoAtual,
            decimal? variacaoDia,
            decimal? dividendYield)
        {
            var ativo = Ativos.SingleOrDefault(item => item.Id == id);
            if (ativo is null) return Task.FromResult(false);
            ativo.PrecoAtual = precoAtual;
            ativo.VariacaoDia = variacaoDia ?? ativo.VariacaoDia;
            ativo.DividendYield = dividendYield ?? ativo.DividendYield;
            ativo.DataAtualizacao = DateTime.UtcNow;
            return Task.FromResult(true);
        }

        public Task<bool> AtualizarTipoAsync(int id, string tipo)
        {
            var ativo = Ativos.SingleOrDefault(item => item.Id == id);
            if (ativo is null) return Task.FromResult(false);
            ativo.Tipo = tipo;
            return Task.FromResult(true);
        }
    }
}
