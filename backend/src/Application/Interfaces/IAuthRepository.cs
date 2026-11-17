using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Application.Interfaces;

public interface IAuthRepository
{
    // Usuários
    Task<User?> GetUserByIdAsync(Guid id);
    Task<User?> GetUserByEmailNormalizedAsync(string emailNormalized);
    Task<User> CreateUserAsync(User user);
    Task UpdateUserAsync(User user);
    Task IncrementTokenVersionAsync(Guid userId);
    Task<IEnumerable<User>> GetAllUsersAsync();

    // Sessões e Refresh Tokens
    Task<UserSession> CreateSessionAsync(UserSession session);
    Task<UserSession?> GetSessionByRefreshTokenHashAsync(string refreshTokenHash);
    Task<UserSession?> GetSessionByPreviousTokenHashAsync(string previousTokenHash);
    Task<UserSession?> GetSessionByIdAsync(Guid sessionId);
    Task RotateSessionAsync(Guid sessionId, string newRefreshTokenHash, string previousTokenHash, DateTime rotatedAt, DateTime idleExpiresAt);
    Task RevokeSessionAsync(Guid sessionId, string reason);
    Task RevokeSessionFamilyAsync(Guid familyId, string reason);
    Task RevokeAllUserSessionsAsync(Guid userId, string reason);
    Task<IEnumerable<UserSession>> GetUserActiveSessionsAsync(Guid userId);

    // Tokens Temporários (Verificação e Reset)
    Task CreateTokenAsync(UserToken token);
    Task<UserToken?> ConsumeTokenAsync(string tokenType, string tokenHash);

    // Códigos de Recuperação MFA
    Task SaveRecoveryCodesAsync(Guid userId, IEnumerable<string> codeHashes);
    Task<bool> ConsumeRecoveryCodeAsync(Guid userId, string codeHash);

    // Auditoria
    Task CreateAuditLogAsync(AuditLog log);
    Task<IEnumerable<AuditLog>> GetRecentAuditLogsAsync(int count = 100);
}
