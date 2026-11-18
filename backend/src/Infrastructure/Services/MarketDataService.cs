using System.Net.Http.Headers;
using System.Net.Http.Json;
using InvestirGo.API.Application.DTOs;

namespace InvestirGo.API.Infrastructure.Services;

public sealed class MarketDataService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public MarketDataService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress ??= new Uri("https://brapi.dev/api/");
        _apiKey = configuration["MarketData:BrapiKey"]
            ?? throw new InvalidOperationException("MarketData:BrapiKey não configurada.");
    }

    public async Task<BrapiResult> ObterDadosCompletosAsync(string ticker, CancellationToken cancellationToken = default)
    {
        var resposta = await ConsultarAsync(ticker, null, cancellationToken);
        return resposta.Results?.FirstOrDefault()
            ?? throw new MarketDataException($"A fonte de mercado não retornou dados para {ticker.ToUpperInvariant()}.");
    }

    public async Task<HistoricoAtivoDto> ObterHistoricoAsync(string ticker, string periodo, string nome, CancellationToken cancellationToken = default)
    {
        var p = string.IsNullOrWhiteSpace(periodo) ? "1D" : periodo.Trim().ToUpperInvariant();
        var range = p switch
        {
            "1D" => "1d", "7D" or "15D" or "1M" => "1mo", "6M" => "6mo",
            "1A" => "1y", "2A" => "2y", "5A" => "5y",
            _ => throw new MarketDataException($"Período {p} não suportado.")
        };

        var resultado = (await ConsultarAsync(ticker, $"range={range}&interval=1d", cancellationToken)).Results?.FirstOrDefault()
            ?? throw new MarketDataException($"A fonte de mercado não retornou histórico para {ticker.ToUpperInvariant()}.");
        var pontos = p == "1D" ? CriarPontosIntradiarios(resultado) : CriarPontosDiarios(resultado, p);
        if (pontos.Count < 2)
            throw new MarketDataException($"Histórico insuficiente para {ticker.ToUpperInvariant()} no período {p}.");

        var inicial = pontos[0].Preco;
        var final = pontos[^1].Preco;
        var variacaoReais = final - inicial;
        var variacaoPercentual = inicial == 0 ? 0 : variacaoReais / inicial * 100m;
        var minima = p == "1D" && resultado.RegularMarketDayLow > 0
            ? resultado.RegularMarketDayLow
            : pontos.Min(x => x.Preco);
        var maxima = p == "1D" && resultado.RegularMarketDayHigh > 0
            ? resultado.RegularMarketDayHigh
            : pontos.Max(x => x.Preco);
        var medio = p == "1D" && resultado.RegularMarketDayLow > 0 && resultado.RegularMarketDayHigh > 0
            ? (resultado.RegularMarketOpen + resultado.RegularMarketDayHigh + resultado.RegularMarketDayLow + resultado.RegularMarketPrice) / 4m
            : pontos.Average(x => x.Preco);
        return new HistoricoAtivoDto(
            ticker.ToUpperInvariant(), nome, p, Math.Round(inicial, 2), Math.Round(final, 2),
            Math.Round(variacaoReais, 2), Math.Round(variacaoPercentual, 2),
            Math.Round(minima, 2), Math.Round(maxima, 2), Math.Round(medio, 2), pontos);
    }

    private async Task<BrapiResponse> ConsultarAsync(string ticker, string? query, CancellationToken cancellationToken)
    {
        var caminho = $"quote/{Uri.EscapeDataString(ticker.Trim().ToUpperInvariant())}";
        if (!string.IsNullOrWhiteSpace(query)) caminho += $"?{query}";
        using var request = new HttpRequestMessage(HttpMethod.Get, caminho);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var detalhe = await response.Content.ReadAsStringAsync(cancellationToken);
            if (detalhe.Length > 250) detalhe = detalhe[..250];
            throw new MarketDataException($"Fonte de mercado respondeu {(int)response.StatusCode} para {ticker.ToUpperInvariant()}: {detalhe}");
        }
        return await response.Content.ReadFromJsonAsync<BrapiResponse>(cancellationToken: cancellationToken)
            ?? throw new MarketDataException("Resposta inválida da fonte de mercado.");
    }

    private static List<HistoricoPontoDto> CriarPontosIntradiarios(BrapiResult r)
    {
        if (r.RegularMarketOpen <= 0 || r.RegularMarketPrice <= 0)
            throw new MarketDataException("A fonte não informou abertura e preço atual para o pregão.");
        var data = r.RegularMarketTime.HasValue
            ? BrazilMarketClock.Convert(r.RegularMarketTime.Value)
            : BrazilMarketClock.Now;
        var variacao = (r.RegularMarketPrice - r.RegularMarketOpen) / r.RegularMarketOpen * 100m;
        return
        [
            new("Abertura", Math.Round(r.RegularMarketOpen, 2), 0, $"{data:dd/MM/yyyy} — abertura"),
            new("Atual", Math.Round(r.RegularMarketPrice, 2), Math.Round(variacao, 2), $"{data:dd/MM/yyyy HH:mm} — última cotação")
        ];
    }

    private static List<HistoricoPontoDto> CriarPontosDiarios(BrapiResult r, string periodo)
    {
        var dados = (r.HistoricalDataPrice ?? []).Where(x => x.Close > 0).OrderBy(x => x.Date).ToList();
        var dias = periodo switch { "7D" => 7, "15D" => 15, _ => 0 };
        if (dias > 0)
        {
            var limite = DateTimeOffset.UtcNow.Date.AddDays(-dias);
            dados = dados.Where(x => DateTimeOffset.FromUnixTimeSeconds(x.Date).Date >= limite).ToList();
        }
        if (dados.Count == 0) return [];
        var inicial = dados[0].Close;
        return dados.Select(x =>
        {
            var data = BrazilMarketClock.Convert(DateTimeOffset.FromUnixTimeSeconds(x.Date));
            var variacao = inicial == 0 ? 0 : (x.Close - inicial) / inicial * 100m;
            return new HistoricoPontoDto(data.ToString("dd/MM"), Math.Round(x.Close, 2), Math.Round(variacao, 2), data.ToString("dd/MM/yyyy"));
        }).ToList();
    }
}

public sealed class MarketDataException(string message) : Exception(message);
public sealed class BrapiResponse { public List<BrapiResult>? Results { get; set; } }
public sealed class BrapiResult
{
    public string? Symbol { get; set; }
    public decimal RegularMarketPrice { get; set; }
    public decimal RegularMarketOpen { get; set; }
    public decimal RegularMarketPreviousClose { get; set; }
    public decimal RegularMarketDayHigh { get; set; }
    public decimal RegularMarketDayLow { get; set; }
    public decimal RegularMarketChangePercent { get; set; }
    public DateTimeOffset? RegularMarketTime { get; set; }
    public List<BrapiHistoricalPrice>? HistoricalDataPrice { get; set; }
}
public sealed class BrapiHistoricalPrice
{
    public long Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
}
