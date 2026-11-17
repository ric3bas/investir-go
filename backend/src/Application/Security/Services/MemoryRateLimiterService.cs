using System.Collections.Concurrent;

namespace InvestirGo.API.Application.Security.Services;

public class MemoryRateLimiterService : IRateLimiterService
{
    private class RateLimitEntry
    {
        public List<DateTime> Timestamps { get; } = [];
        public object Lock { get; } = new();
    }

    private readonly ConcurrentDictionary<string, RateLimitEntry> _entries = new();

    public (bool IsAllowed, int RemainingAttempts, TimeSpan RetryAfter) CheckRateLimit(string key, int maxAttempts, TimeSpan window)
    {
        var now = DateTime.UtcNow;
        var entry = _entries.GetOrAdd(key, _ => new RateLimitEntry());

        lock (entry.Lock)
        {
            // Remove timestamps fora da janela móvel
            var cutoff = now - window;
            entry.Timestamps.RemoveAll(t => t < cutoff);

            if (entry.Timestamps.Count >= maxAttempts)
            {
                var oldest = entry.Timestamps[0];
                var retryAfter = (oldest + window) - now;
                if (retryAfter < TimeSpan.Zero) retryAfter = TimeSpan.FromSeconds(1);

                return (false, 0, retryAfter);
            }

            entry.Timestamps.Add(now);
            int remaining = maxAttempts - entry.Timestamps.Count;
            return (true, remaining, TimeSpan.Zero);
        }
    }

    public void ResetRateLimit(string key)
    {
        _entries.TryRemove(key, out _);
    }
}
