namespace InvestirGo.API.Application.Security.Services;

public interface IRateLimiterService
{
    (bool IsAllowed, int RemainingAttempts, TimeSpan RetryAfter) CheckRateLimit(string key, int maxAttempts, TimeSpan window);
    void ResetRateLimit(string key);
}
