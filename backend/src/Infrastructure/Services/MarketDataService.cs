using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Application.Interfaces;

namespace InvestirGo.API.Infrastructure.Services;

public class MarketDataService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public MarketDataService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["MarketData:BrapiKey"] ?? throw new InvalidOperationException("BrapiKey não configurada.");
    }

    public async Task<BrapiResult?> ObterDadosCompletos(string ticker)
    {
        try
        {
            var response = await _httpClient.GetFromJsonAsync<BrapiResponse>(
                $"https://brapi.dev/api/quote/{ticker}?token={_apiKey}");
            
            return response?.Results?.FirstOrDefault();
        }
        catch
        {
            return null;
        }
    }
}

public class BrapiResponse { public List<BrapiResult>? Results { get; set; } }
public class BrapiResult { 
    public decimal RegularMarketPrice { get; set; } 
    public decimal RegularMarketMarketOpen { get; set; } // Adicionando campo de abertura
    public decimal RegularMarketDayHigh { get; set; }
    public decimal RegularMarketDayLow { get; set; }
}

