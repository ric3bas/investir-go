namespace InvestirGo.API.Application.DTOs;

public record RegisterRequestDto(
    string Nome,
    string Email,
    string Password
);

public record LoginRequestDto(
    string Email,
    string Password
);

public record LoginResponseDto(
    bool RequiresMfa,
    string? MfaToken,
    string? AccessToken,
    int? ExpiresIn,
    UserDto? User
);

public record MfaVerifyRequestDto(
    string MfaToken,
    string Code,
    bool IsRecoveryCode = false
);

public record RefreshTokenResponseDto(
    string AccessToken,
    int ExpiresIn,
    UserDto User
);

public record ChangePasswordRequestDto(
    string CurrentPassword,
    string NewPassword
);

public record ForgotPasswordRequestDto(
    string Email
);

public record ResetPasswordRequestDto(
    string Token,
    string NewPassword
);

public record VerifyEmailRequestDto(
    string Token
);

public record MfaSetupResponseDto(
    string Secret,
    string QrCodeUri,
    string QrCodeBase64,
    List<string> RecoveryCodes
);

public record MfaConfirmRequestDto(
    string Code
);

public record MfaDisableRequestDto(
    string Password
);

public record UserDto(
    Guid Id,
    string Nome,
    string Email,
    string Role,
    bool EmailVerified,
    bool TotpEnabled,
    DateTime CreatedAt
);

public record UserSessionDto(
    Guid Id,
    string? UserAgent,
    string? IpAddress,
    bool IsCurrent,
    DateTime CreatedAt,
    DateTime LastActiveAt
);

public record AuditLogDto(
    long Id,
    string Action,
    string Status,
    string? IpAddress,
    string? UserAgent,
    string? Details,
    DateTime CreatedAt
);
