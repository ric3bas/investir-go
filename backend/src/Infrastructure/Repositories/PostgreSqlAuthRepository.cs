using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class PostgreSqlAuthRepository : IAuthRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public PostgreSqlAuthRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, nome, email, email_normalized AS EmailNormalized, 
                   password_hash AS PasswordHash, role, is_active AS IsActive, 
                   email_verified AS EmailVerified, token_version AS TokenVersion, 
                   totp_enabled AS TotpEnabled, totp_secret_encrypted AS TotpSecretEncrypted, 
                   last_totp_step AS LastTotpStep, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM auth.users
            WHERE id = @id";
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { id });
    }

    public async Task<User?> GetUserByEmailNormalizedAsync(string emailNormalized)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, nome, email, email_normalized AS EmailNormalized, 
                   password_hash AS PasswordHash, role, is_active AS IsActive, 
                   email_verified AS EmailVerified, token_version AS TokenVersion, 
                   totp_enabled AS TotpEnabled, totp_secret_encrypted AS TotpSecretEncrypted, 
                   last_totp_step AS LastTotpStep, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM auth.users
            WHERE email_normalized = @emailNormalized";
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { emailNormalized });
    }

    public async Task<User> CreateUserAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO auth.users (id, nome, email, email_normalized, password_hash, role, is_active, email_verified, token_version, totp_enabled, totp_secret_encrypted, last_totp_step, created_at, updated_at)
            VALUES (@Id, @Nome, @Email, @EmailNormalized, @PasswordHash, @Role, @IsActive, @EmailVerified, @TokenVersion, @TotpEnabled, @TotpSecretEncrypted, @LastTotpStep, @CreatedAt, @UpdatedAt)
            RETURNING id";
        user.Id = await connection.ExecuteScalarAsync<Guid>(sql, user);
        return user;
    }

    public async Task UpdateUserAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        user.UpdatedAt = DateTime.UtcNow;
        const string sql = @"
            UPDATE auth.users
            SET nome = @Nome,
                email = @Email,
                email_normalized = @EmailNormalized,
                password_hash = @PasswordHash,
                role = @Role,
                is_active = @IsActive,
                email_verified = @EmailVerified,
                token_version = @TokenVersion,
                totp_enabled = @TotpEnabled,
                totp_secret_encrypted = @TotpSecretEncrypted,
                last_totp_step = @LastTotpStep,
                updated_at = @UpdatedAt
            WHERE id = @Id";
        await connection.ExecuteAsync(sql, user);
    }

    public async Task IncrementTokenVersionAsync(Guid userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE auth.users
            SET token_version = token_version + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @userId";
        await connection.ExecuteAsync(sql, new { userId });
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, nome, email, email_normalized AS EmailNormalized, 
                   password_hash AS PasswordHash, role, is_active AS IsActive, 
                   email_verified AS EmailVerified, token_version AS TokenVersion, 
                   totp_enabled AS TotpEnabled, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM auth.users
            ORDER BY created_at DESC";
        return await connection.QueryAsync<User>(sql);
    }

    public async Task<UserSession> CreateSessionAsync(UserSession session)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO auth.user_sessions (id, user_id, session_family_id, refresh_token_hash, previous_token_hash, previous_token_rotated_at, user_agent, ip_address, is_revoked, revoked_reason, expires_at, idle_expires_at, created_at, last_active_at)
            VALUES (@Id, @UserId, @SessionFamilyId, @RefreshTokenHash, @PreviousTokenHash, @PreviousTokenRotatedAt, @UserAgent, @IpAddress, @IsRevoked, @RevokedReason, @ExpiresAt, @IdleExpiresAt, @CreatedAt, @LastActiveAt)
            RETURNING id";
        session.Id = await connection.ExecuteScalarAsync<Guid>(sql, session);
        return session;
    }

    public async Task<UserSession?> GetSessionByRefreshTokenHashAsync(string refreshTokenHash)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, user_id AS UserId, session_family_id AS SessionFamilyId, 
                   refresh_token_hash AS RefreshTokenHash, previous_token_hash AS PreviousTokenHash, 
                   previous_token_rotated_at AS PreviousTokenRotatedAt, user_agent AS UserAgent, 
                   ip_address AS IpAddress, is_revoked AS IsRevoked, revoked_reason AS RevokedReason, 
                   expires_at AS ExpiresAt, idle_expires_at AS IdleExpiresAt, 
                   created_at AS CreatedAt, last_active_at AS LastActiveAt
            FROM auth.user_sessions
            WHERE refresh_token_hash = @refreshTokenHash";
        return await connection.QuerySingleOrDefaultAsync<UserSession>(sql, new { refreshTokenHash });
    }

    public async Task<UserSession?> GetSessionByPreviousTokenHashAsync(string previousTokenHash)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, user_id AS UserId, session_family_id AS SessionFamilyId, 
                   refresh_token_hash AS RefreshTokenHash, previous_token_hash AS PreviousTokenHash, 
                   previous_token_rotated_at AS PreviousTokenRotatedAt, user_agent AS UserAgent, 
                   ip_address AS IpAddress, is_revoked AS IsRevoked, revoked_reason AS RevokedReason, 
                   expires_at AS ExpiresAt, idle_expires_at AS IdleExpiresAt, 
                   created_at AS CreatedAt, last_active_at AS LastActiveAt
            FROM auth.user_sessions
            WHERE previous_token_hash = @previousTokenHash";
        return await connection.QuerySingleOrDefaultAsync<UserSession>(sql, new { previousTokenHash });
    }

    public async Task<UserSession?> GetSessionByIdAsync(Guid sessionId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, user_id AS UserId, session_family_id AS SessionFamilyId, 
                   refresh_token_hash AS RefreshTokenHash, previous_token_hash AS PreviousTokenHash, 
                   previous_token_rotated_at AS PreviousTokenRotatedAt, user_agent AS UserAgent, 
                   ip_address AS IpAddress, is_revoked AS IsRevoked, revoked_reason AS RevokedReason, 
                   expires_at AS ExpiresAt, idle_expires_at AS IdleExpiresAt, 
                   created_at AS CreatedAt, last_active_at AS LastActiveAt
            FROM auth.user_sessions
            WHERE id = @sessionId";
        return await connection.QuerySingleOrDefaultAsync<UserSession>(sql, new { sessionId });
    }

    public async Task RotateSessionAsync(Guid sessionId, string newRefreshTokenHash, string previousTokenHash, DateTime rotatedAt, DateTime idleExpiresAt)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE auth.user_sessions
            SET previous_token_hash = @previousTokenHash,
                previous_token_rotated_at = @rotatedAt,
                refresh_token_hash = @newRefreshTokenHash,
                idle_expires_at = @idleExpiresAt,
                last_active_at = @rotatedAt
            WHERE id = @sessionId AND is_revoked = FALSE";
        await connection.ExecuteAsync(sql, new { sessionId, newRefreshTokenHash, previousTokenHash, rotatedAt, idleExpiresAt });
    }

    public async Task RevokeSessionAsync(Guid sessionId, string reason)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE auth.user_sessions
            SET is_revoked = TRUE,
                revoked_reason = @reason
            WHERE id = @sessionId";
        await connection.ExecuteAsync(sql, new { sessionId, reason });
    }

    public async Task RevokeSessionFamilyAsync(Guid familyId, string reason)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE auth.user_sessions
            SET is_revoked = TRUE,
                revoked_reason = @reason
            WHERE session_family_id = @familyId";
        await connection.ExecuteAsync(sql, new { familyId, reason });
    }

    public async Task RevokeAllUserSessionsAsync(Guid userId, string reason)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE auth.user_sessions
            SET is_revoked = TRUE,
                revoked_reason = @reason
            WHERE user_id = @userId AND is_revoked = FALSE";
        await connection.ExecuteAsync(sql, new { userId, reason });
    }

    public async Task<IEnumerable<UserSession>> GetUserActiveSessionsAsync(Guid userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, user_id AS UserId, session_family_id AS SessionFamilyId, 
                   refresh_token_hash AS RefreshTokenHash, previous_token_hash AS PreviousTokenHash, 
                   previous_token_rotated_at AS PreviousTokenRotatedAt, user_agent AS UserAgent, 
                   ip_address AS IpAddress, is_revoked AS IsRevoked, revoked_reason AS RevokedReason, 
                   expires_at AS ExpiresAt, idle_expires_at AS IdleExpiresAt, 
                   created_at AS CreatedAt, last_active_at AS LastActiveAt
            FROM auth.user_sessions
            WHERE user_id = @userId AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP AND idle_expires_at > CURRENT_TIMESTAMP
            ORDER BY last_active_at DESC";
        return await connection.QueryAsync<UserSession>(sql, new { userId });
    }

    public async Task CreateTokenAsync(UserToken token)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO auth.user_tokens (id, user_id, token_type, token_hash, expires_at, consumed_at, created_at)
            VALUES (@Id, @UserId, @TokenType, @TokenHash, @ExpiresAt, @ConsumedAt, @CreatedAt)";
        await connection.ExecuteAsync(sql, token);
    }

    public async Task<UserToken?> ConsumeTokenAsync(string tokenType, string tokenHash)
    {
        using var connection = _connectionFactory.CreateConnection();
        // Consumo atômico para impedir reaproveitamento de tokens de verificação e redefinição
        const string sql = @"
            UPDATE auth.user_tokens
            SET consumed_at = CURRENT_TIMESTAMP
            WHERE token_type = @tokenType 
              AND token_hash = @tokenHash 
              AND consumed_at IS NULL 
              AND expires_at > CURRENT_TIMESTAMP
            RETURNING id, user_id AS UserId, token_type AS TokenType, token_hash AS TokenHash, expires_at AS ExpiresAt, consumed_at AS ConsumedAt, created_at AS CreatedAt";
        return await connection.QuerySingleOrDefaultAsync<UserToken>(sql, new { tokenType, tokenHash });
    }

    public async Task SaveRecoveryCodesAsync(Guid userId, IEnumerable<string> codeHashes)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO auth.mfa_recovery_codes (id, user_id, code_hash, is_used, created_at)
            VALUES (@Id, @UserId, @CodeHash, FALSE, CURRENT_TIMESTAMP)";

        var entries = codeHashes.Select(h => new
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CodeHash = h
        });

        await connection.ExecuteAsync(sql, entries);
    }

    public async Task<bool> ConsumeRecoveryCodeAsync(Guid userId, string codeHash)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE auth.mfa_recovery_codes
            SET is_used = TRUE,
                used_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId 
              AND code_hash = @codeHash 
              AND is_used = FALSE";
        int rows = await connection.ExecuteAsync(sql, new { userId, codeHash });
        return rows > 0;
    }

    public async Task CreateAuditLogAsync(AuditLog log)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO auth.audit_logs (user_id, action, status, ip_address, user_agent, details, created_at)
            VALUES (@UserId, @Action, @Status, @IpAddress, @UserAgent, @Details, @CreatedAt)";
        await connection.ExecuteAsync(sql, log);
    }

    public async Task<IEnumerable<AuditLog>> GetRecentAuditLogsAsync(int count = 100)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            SELECT id, user_id AS UserId, action, status, ip_address AS IpAddress, user_agent AS UserAgent, details, created_at AS CreatedAt
            FROM auth.audit_logs
            ORDER BY created_at DESC
            LIMIT @count";
        return await connection.QueryAsync<AuditLog>(sql, new { count });
    }
}
