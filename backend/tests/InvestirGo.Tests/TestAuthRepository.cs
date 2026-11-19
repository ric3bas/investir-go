using System.Collections.Concurrent;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.Tests;

internal sealed class TestAuthRepository : IAuthRepository
{
    private readonly ConcurrentDictionary<Guid, User> _users = new();
    private readonly ConcurrentDictionary<string, Guid> _emailIndex = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<Guid, UserSession> _sessions = new();
    private readonly ConcurrentDictionary<Guid, UserToken> _tokens = new();
    private readonly ConcurrentDictionary<Guid, MfaRecoveryCode> _recoveryCodes = new();
    private readonly ConcurrentBag<AuditLog> _auditLogs = [];
    private readonly object _syncLock = new();
    private long _auditLogIdCounter = 0;

    public Task<User?> GetUserByIdAsync(Guid id)
    {
        _users.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<User?> GetUserByEmailNormalizedAsync(string emailNormalized)
    {
        if (_emailIndex.TryGetValue(emailNormalized, out var id) && _users.TryGetValue(id, out var user))
        {
            return Task.FromResult<User?>(user);
        }
        return Task.FromResult<User?>(null);
    }

    public Task<User> CreateUserAsync(User user)
    {
        lock (_syncLock)
        {
            if (_emailIndex.ContainsKey(user.EmailNormalized))
            {
                throw new InvalidOperationException("E-mail já cadastrado.");
            }
            if (user.Id == Guid.Empty) user.Id = Guid.NewGuid();
            _users[user.Id] = user;
            _emailIndex[user.EmailNormalized] = user.Id;
            return Task.FromResult(user);
        }
    }

    public Task UpdateUserAsync(User user)
    {
        lock (_syncLock)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _users[user.Id] = user;
            _emailIndex[user.EmailNormalized] = user.Id;
            return Task.CompletedTask;
        }
    }

    public Task IncrementTokenVersionAsync(Guid userId)
    {
        lock (_syncLock)
        {
            if (_users.TryGetValue(userId, out var user))
            {
                user.TokenVersion++;
                user.UpdatedAt = DateTime.UtcNow;
            }
            return Task.CompletedTask;
        }
    }

    public Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return Task.FromResult<IEnumerable<User>>(_users.Values.OrderByDescending(u => u.CreatedAt).ToList());
    }

    public Task<UserSession> CreateSessionAsync(UserSession session)
    {
        lock (_syncLock)
        {
            if (session.Id == Guid.Empty) session.Id = Guid.NewGuid();
            _sessions[session.Id] = session;
            return Task.FromResult(session);
        }
    }

    public Task<UserSession?> GetSessionByRefreshTokenHashAsync(string refreshTokenHash)
    {
        var session = _sessions.Values.FirstOrDefault(s => s.RefreshTokenHash == refreshTokenHash);
        return Task.FromResult(session);
    }

    public Task<UserSession?> GetSessionByPreviousTokenHashAsync(string previousTokenHash)
    {
        var session = _sessions.Values.FirstOrDefault(s => s.PreviousTokenHash == previousTokenHash);
        return Task.FromResult(session);
    }

    public Task<UserSession?> GetSessionByIdAsync(Guid sessionId)
    {
        _sessions.TryGetValue(sessionId, out var session);
        return Task.FromResult(session);
    }

    public Task RotateSessionAsync(Guid sessionId, string newRefreshTokenHash, string previousTokenHash, DateTime rotatedAt, DateTime idleExpiresAt)
    {
        lock (_syncLock)
        {
            if (_sessions.TryGetValue(sessionId, out var session) && !session.IsRevoked)
            {
                session.PreviousTokenHash = previousTokenHash;
                session.PreviousTokenRotatedAt = rotatedAt;
                session.RefreshTokenHash = newRefreshTokenHash;
                session.IdleExpiresAt = idleExpiresAt;
                session.LastActiveAt = rotatedAt;
            }
            return Task.CompletedTask;
        }
    }

    public Task RevokeSessionAsync(Guid sessionId, string reason)
    {
        lock (_syncLock)
        {
            if (_sessions.TryGetValue(sessionId, out var session))
            {
                session.IsRevoked = true;
                session.RevokedReason = reason;
            }
            return Task.CompletedTask;
        }
    }

    public Task RevokeSessionFamilyAsync(Guid familyId, string reason)
    {
        lock (_syncLock)
        {
            foreach (var session in _sessions.Values.Where(s => s.SessionFamilyId == familyId))
            {
                session.IsRevoked = true;
                session.RevokedReason = reason;
            }
            return Task.CompletedTask;
        }
    }

    public Task RevokeAllUserSessionsAsync(Guid userId, string reason)
    {
        lock (_syncLock)
        {
            foreach (var session in _sessions.Values.Where(s => s.UserId == userId && !s.IsRevoked))
            {
                session.IsRevoked = true;
                session.RevokedReason = reason;
            }
            return Task.CompletedTask;
        }
    }

    public Task<IEnumerable<UserSession>> GetUserActiveSessionsAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var list = _sessions.Values
            .Where(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > now && s.IdleExpiresAt > now)
            .OrderByDescending(s => s.LastActiveAt)
            .ToList();
        return Task.FromResult<IEnumerable<UserSession>>(list);
    }

    public Task CreateTokenAsync(UserToken token)
    {
        lock (_syncLock)
        {
            if (token.Id == Guid.Empty) token.Id = Guid.NewGuid();
            _tokens[token.Id] = token;
            return Task.CompletedTask;
        }
    }

    public Task<UserToken?> ConsumeTokenAsync(string tokenType, string tokenHash)
    {
        lock (_syncLock)
        {
            var now = DateTime.UtcNow;
            var token = _tokens.Values.FirstOrDefault(t => 
                t.TokenType == tokenType && 
                t.TokenHash == tokenHash && 
                t.ConsumedAt == null && 
                t.ExpiresAt > now);

            if (token != null)
            {
                token.ConsumedAt = now;
                return Task.FromResult<UserToken?>(token);
            }
            return Task.FromResult<UserToken?>(null);
        }
    }

    public Task SaveRecoveryCodesAsync(Guid userId, IEnumerable<string> codeHashes)
    {
        lock (_syncLock)
        {
            foreach (var hash in codeHashes)
            {
                var code = new MfaRecoveryCode
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CodeHash = hash,
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                };
                _recoveryCodes[code.Id] = code;
            }
            return Task.CompletedTask;
        }
    }

    public Task<bool> ConsumeRecoveryCodeAsync(Guid userId, string codeHash)
    {
        lock (_syncLock)
        {
            var code = _recoveryCodes.Values.FirstOrDefault(c => 
                c.UserId == userId && 
                c.CodeHash == codeHash && 
                !c.IsUsed);

            if (code != null)
            {
                code.IsUsed = true;
                code.UsedAt = DateTime.UtcNow;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    public Task CreateAuditLogAsync(AuditLog log)
    {
        lock (_syncLock)
        {
            log.Id = Interlocked.Increment(ref _auditLogIdCounter);
            _auditLogs.Add(log);
            return Task.CompletedTask;
        }
    }

    public Task<IEnumerable<AuditLog>> GetRecentAuditLogsAsync(int count = 100)
    {
        var list = _auditLogs.OrderByDescending(l => l.CreatedAt).Take(count).ToList();
        return Task.FromResult<IEnumerable<AuditLog>>(list);
    }
}

