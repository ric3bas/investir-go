using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using InvestirGo.API.Application.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace InvestirGo.API.Infrastructure.Services;

public sealed class MercadoPainelService(
    MarketDataService marketData,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    IMemoryCache cache,
    ILogger<MercadoPainelService> logger)
{
    private const string CacheKey = "mercado:painel:v1";
    private static readonly SemaphoreSlim ConsultaGlobal = new(1, 1);

    public async Task<MercadoPainelDto> ObterAsync(bool forcar, CancellationToken cancellationToken = default)
    {
        if (!forcar && cache.TryGetValue<MercadoPainelDto>(CacheKey, out var armazenado) && armazenado is not null)
            return armazenado;

        await ConsultaGlobal.WaitAsync(cancellationToken);
        try
        {
            if (!forcar && cache.TryGetValue<MercadoPainelDto>(CacheKey, out armazenado) && armazenado is not null)
                return armazenado;

            var ibovespaTask = ConsultarIbovespaAsync(cancellationToken);
            var dolarTask = ConsultarDolarAsync(cancellationToken);
            await Task.WhenAll(ibovespaTask, dolarTask);

            var (ibovespa, avisoIbovespa) = await ibovespaTask;
            var (dolar, avisoDolar) = await dolarTask;
            var avisos = new[] { avisoIbovespa, avisoDolar }
                .Where(aviso => !string.IsNullOrWhiteSpace(aviso))
                .Select(aviso => aviso!)
                .ToArray();

            if (ibovespa is null && dolar is null)
                throw new MarketDataException("Os indicadores de mercado estão temporariamente indisponíveis.");

            var painel = new MercadoPainelDto(ibovespa, dolar, DateTimeOffset.UtcNow, avisos);
            cache.Set(CacheKey, painel, TimeSpan.FromMinutes(1));
            return painel;
        }
        finally
        {
            ConsultaGlobal.Release();
        }
    }

    private async Task<(MercadoIndicadorDto? Indicador, string? Aviso)> ConsultarIbovespaAsync(
        CancellationToken cancellationToken)
    {
        try
        {
            var cotacao = await marketData.ObterIbovespaComHistoricoAsync(cancellationToken);
            if (cotacao.RegularMarketPrice <= 0)
                throw new MarketDataException("O provedor retornou pontuação inválida para o Ibovespa.");

            var variacao = cotacao.RegularMarketChangePercent;
            if (variacao == 0 && cotacao.RegularMarketPreviousClose > 0)
                variacao = (cotacao.RegularMarketPrice - cotacao.RegularMarketPreviousClose)
                    / cotacao.RegularMarketPreviousClose * 100m;

            var historico = (cotacao.HistoricalDataPrice ?? [])
                .Where(ponto => ponto.Close > 0)
                .OrderBy(ponto => ponto.Date)
                .Select(ponto => new MercadoPontoDto(
                    DateTimeOffset.FromUnixTimeSeconds(ponto.Date),
                    Math.Round(ponto.Close, 2)))
                .ToList();

            var atualizadoEm = cotacao.RegularMarketTime ?? DateTimeOffset.UtcNow;
            AdicionarOuSubstituirUltimoPonto(historico, atualizadoEm, cotacao.RegularMarketPrice);

            return (new MercadoIndicadorDto(
                "IBOV",
                "Ibovespa",
                "pontos",
                Math.Round(cotacao.RegularMarketPrice, 0),
                Math.Round(variacao, 2),
                Math.Round(cotacao.RegularMarketDayLow, 0),
                Math.Round(cotacao.RegularMarketDayHigh, 0),
                atualizadoEm,
                "brapi",
                historico), null);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Falha ao consultar o Ibovespa.");
            return (null, "Ibovespa indisponível no momento.");
        }
    }

    private async Task<(MercadoIndicadorDto? Indicador, string? Aviso)> ConsultarDolarAsync(
        CancellationToken cancellationToken)
    {
        try
        {
            var client = httpClientFactory.CreateClient("AwesomeApi");
            var apiKey = configuration["MarketData:AwesomeApiKey"];
            if (!string.IsNullOrWhiteSpace(apiKey))
                client.DefaultRequestHeaders.TryAddWithoutValidation("x-api-key", apiKey);
            client.DefaultRequestHeaders.CacheControl = new CacheControlHeaderValue { NoCache = true, NoStore = true };

            var atualTask = client.GetFromJsonAsync<Dictionary<string, AwesomeMoedaDto>>(
                "json/last/USD-BRL", cancellationToken);
            var historicoTask = client.GetFromJsonAsync<List<AwesomeMoedaDto>>(
                "json/daily/USD-BRL/30", cancellationToken);
            await Task.WhenAll(atualTask, historicoTask);

            var atual = (await atualTask)?.GetValueOrDefault("USDBRL")
                ?? throw new MarketDataException("A fonte não retornou a cotação USD/BRL.");
            var valorAtual = Decimal(atual.Bid);
            if (valorAtual <= 0)
                throw new MarketDataException("A fonte retornou uma cotação USD/BRL inválida.");

            var atualizadoEm = Timestamp(atual.Timestamp);
            var historico = (await historicoTask ?? [])
                .Select(item => new { Data = Timestamp(item.Timestamp), Valor = Decimal(item.Bid) })
                .Where(item => item.Valor > 0)
                .OrderBy(item => item.Data)
                .Select(item => new MercadoPontoDto(item.Data, Math.Round(item.Valor, 4)))
                .ToList();
            AdicionarOuSubstituirUltimoPonto(historico, atualizadoEm, valorAtual);

            return (new MercadoIndicadorDto(
                "USD/BRL",
                "Dólar comercial",
                "reais",
                Math.Round(valorAtual, 4),
                Math.Round(Decimal(atual.PctChange), 2),
                Math.Round(Decimal(atual.Low), 4),
                Math.Round(Decimal(atual.High), 4),
                atualizadoEm,
                "AwesomeAPI",
                historico), null);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Falha ao consultar o dólar comercial.");
            return (null, "Dólar comercial indisponível no momento.");
        }
    }

    private static void AdicionarOuSubstituirUltimoPonto(
        List<MercadoPontoDto> historico,
        DateTimeOffset data,
        decimal valor)
    {
        var indiceMesmoDia = historico.FindLastIndex(ponto => ponto.Data.UtcDateTime.Date == data.UtcDateTime.Date);
        var atual = new MercadoPontoDto(data, Math.Round(valor, 4));
        if (indiceMesmoDia >= 0)
            historico[indiceMesmoDia] = atual;
        else
            historico.Add(atual);
    }

    private static decimal Decimal(string? valor) =>
        decimal.TryParse(valor, NumberStyles.Any, CultureInfo.InvariantCulture, out var numero) ? numero : 0m;

    private static DateTimeOffset Timestamp(string? valor)
    {
        if (!long.TryParse(valor, out var timestamp)) return DateTimeOffset.UtcNow;
        return timestamp > 10_000_000_000
            ? DateTimeOffset.FromUnixTimeMilliseconds(timestamp)
            : DateTimeOffset.FromUnixTimeSeconds(timestamp);
    }

    private sealed class AwesomeMoedaDto
    {
        [JsonPropertyName("bid")] public string? Bid { get; init; }
        [JsonPropertyName("high")] public string? High { get; init; }
        [JsonPropertyName("low")] public string? Low { get; init; }
        [JsonPropertyName("pctChange")] public string? PctChange { get; init; }
        [JsonPropertyName("timestamp")] public string? Timestamp { get; init; }
    }
}
