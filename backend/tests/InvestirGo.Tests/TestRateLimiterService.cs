using System.Collections.Concurrent;
using InvestirGo.API.Application.Security.Services;

namespace InvestirGo.Tests;

/// <summary>Dublê isolado do processo de testes; não faz parte da API publicada.</summary>
internal sealed class TestRateLimiterService : IRateLimiterService
{
    private readonly ConcurrentDictionary<string, List<DateTime>> _attempts = new();

    public (bool IsAllowed, int RemainingAttempts, TimeSpan RetryAfter) CheckRateLimit(
        string key,
        int maxAttempts,
        TimeSpan window)
    {
        var values = _attempts.GetOrAdd(key, _ => []);
        lock (values)
        {
            var now = DateTime.UtcNow;
            values.RemoveAll(value => value < now - window);
            if (values.Count >= maxAttempts)
                return (false, 0, values[0].Add(window) - now);

            values.Add(now);
            return (true, maxAttempts - values.Count, TimeSpan.Zero);
        }
    }

    public void ResetRateLimit(string key) => _attempts.TryRemove(key, out _);
}
