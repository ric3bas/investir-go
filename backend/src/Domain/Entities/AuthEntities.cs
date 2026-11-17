namespace InvestirGo.API.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string EmailNormalized { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User"; // 'User' ou 'Admin'
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public int TokenVersion { get; set; } = 1;
    public bool TotpEnabled { get; set; } = false;
    public string? TotpSecretEncrypted { get; set; }
    public long? LastTotpStep { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class UserSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid SessionFamilyId { get; set; } = Guid.NewGuid();
    public string RefreshTokenHash { get; set; } = string.Empty;
    public string? PreviousTokenHash { get; set; }
    public DateTime? PreviousTokenRotatedAt { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
    public bool IsRevoked { get; set; } = false;
    public string? RevokedReason { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime IdleExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
}

public class UserToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string TokenType { get; set; } = string.Empty; // EMAIL_VERIFICATION, PASSWORD_RESET, MFA_CHALLENGE
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class MfaRecoveryCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string CodeHash { get; set; } = string.Empty;
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public long Id { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = "SUCCESS"; // SUCCESS, FAILED, SUSPICIOUS
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
