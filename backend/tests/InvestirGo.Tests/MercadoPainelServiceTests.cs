using System.Net;
using System.Text;
using InvestirGo.API.Infrastructure.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace InvestirGo.Tests;

public sealed class MercadoPainelServiceTests
{
    [Fact]
    public async Task ObterAsync_ConsolidaIbovespaEDolarComHistoricoReal()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["MarketData:BrapiKey"] = "test-key" })
            .Build();
        using var brapiClient = new HttpClient(new BrapiHandlerFake())
        {
            BaseAddress = new Uri("https://brapi.dev/api/")
        };
        using var awesomeClient = new HttpClient(new AwesomeHandlerFake())
        {
            BaseAddress = new Uri("https://economia.awesomeapi.com.br/")
        };
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new MercadoPainelService(
            new MarketDataService(brapiClient, configuration),
            new HttpClientFactoryFake(awesomeClient),
            configuration,
            cache,
            NullLogger<MercadoPainelService>.Instance);

        var painel = await service.ObterAsync(forcar: true);

        Assert.NotNull(painel.Ibovespa);
        Assert.Equal(158_420m, painel.Ibovespa.Valor);
        Assert.Equal(1.25m, painel.Ibovespa.VariacaoPercentual);
        Assert.Equal(3, painel.Ibovespa.Historico.Count);
        Assert.NotNull(painel.Dolar);
        Assert.Equal(5.2189m, painel.Dolar.Valor);
        Assert.Equal(-1.04m, painel.Dolar.VariacaoPercentual);
        Assert.Equal(3, painel.Dolar.Historico.Count);
        Assert.Empty(painel.Avisos);
    }

    private sealed class BrapiHandlerFake : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            const string json = """
                {
                  "results": [{
                    "symbol": "^BVSP",
                    "regularMarketPrice": 158420,
                    "regularMarketPreviousClose": 156463.7,
                    "regularMarketDayLow": 156900,
                    "regularMarketDayHigh": 159080,
                    "regularMarketChangePercent": 1.25,
                    "regularMarketTime": "2026-11-20T17:10:00Z",
                    "historicalDataPrice": [
                      {"date": 1794873600, "close": 155800},
                      {"date": 1794960000, "close": 156464}
                    ]
                  }]
                }
                """;
            return Task.FromResult(Json(json));
        }
    }

    private sealed class AwesomeHandlerFake : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsolutePath.Contains("/last/", StringComparison.Ordinal) == true)
            {
                const string atual = """
                    {"USDBRL":{"bid":"5.2189","high":"5.3430","low":"5.2086","pctChange":"-1.035958","timestamp":"1795194600"}}
                    """;
                return Task.FromResult(Json(atual));
            }

            const string historico = """
                [
                  {"bid":"5.2700","timestamp":"1794873600"},
                  {"bid":"5.2500","timestamp":"1794960000"}
                ]
                """;
            return Task.FromResult(Json(historico));
        }
    }

    private sealed class HttpClientFactoryFake(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private static HttpResponseMessage Json(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };
}
