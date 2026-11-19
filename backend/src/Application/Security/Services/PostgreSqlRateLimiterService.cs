using System.Data;
using Dapper;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Application.Security.Services;

/// <summary>
/// Rate limit compartilhado e persistente. Funciona entre réplicas e não é
/// perdido quando o container reinicia.
/// </summary>
public sealed class PostgreSqlRateLimiterService(DbConnectionFactory dbFactory) : IRateLimiterService
{
    public (bool IsAllowed, int RemainingAttempts, TimeSpan RetryAfter) CheckRateLimit(
        string key,
        int maxAttempts,
        TimeSpan window)
    {
        using var connection = dbFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted);

        connection.Execute(
            "SELECT pg_advisory_xact_lock(hashtext(@Key));",
            new { Key = key },
            transaction);

        var now = DateTime.UtcNow;
        var cutoff = now.Subtract(window);
        connection.Execute(
            "DELETE FROM auth.rate_limit_attempts WHERE rate_key = @Key AND occurred_at < @Cutoff;",
            new { Key = key, Cutoff = cutoff },
            transaction);

        var attempts = connection.Query<DateTime>(
            "SELECT occurred_at FROM auth.rate_limit_attempts WHERE rate_key = @Key ORDER BY occurred_at;",
            new { Key = key },
            transaction).ToList();

        if (attempts.Count >= maxAttempts)
        {
            transaction.Commit();
            var retryAfter = attempts[0].Add(window) - now;
            return (false, 0, retryAfter > TimeSpan.Zero ? retryAfter : TimeSpan.FromSeconds(1));
        }

        connection.Execute(
            "INSERT INTO auth.rate_limit_attempts (rate_key, occurred_at) VALUES (@Key, @Now);",
            new { Key = key, Now = now },
            transaction);
        transaction.Commit();

        return (true, maxAttempts - attempts.Count - 1, TimeSpan.Zero);
    }

    public void ResetRateLimit(string key)
    {
        using var connection = dbFactory.CreateConnection();
        connection.Execute("DELETE FROM auth.rate_limit_attempts WHERE rate_key = @Key;", new { Key = key });
    }
}
