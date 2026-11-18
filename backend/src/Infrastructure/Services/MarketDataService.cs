using System.Net.Http.Json;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Application.Interfaces;

namespace InvestirGo.API.Infrastructure.Services;

public class MarketDataService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey = "pwAf7GuRVSyJpETLGUkKuD; // Substitua pela sua chave da Brapi

    public MarketDataService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<decimal> ObterCotacaoAtual(string ticker)
    {
        try
        {
            // Chamada para API da Brapi
            var response = await _httpClient.GetFromJsonAsync<BrapiResponse>(
                $"https://brapi.dev/api/quote/{ticker}?token={_apiKey}");
            
            return response?.Results?[0]?.RegularMarketPrice ?? 0;
        }
        catch
        {
            return 0; // Logar erro em produção
        }
    }
}

public class BrapiResponse { public List<BrapiResult>? Results { get; set; } }
public class BrapiResult { public decimal RegularMarketPrice { get; set; } }
