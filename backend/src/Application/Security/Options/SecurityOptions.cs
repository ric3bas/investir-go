namespace InvestirGo.API.Application.Security.Options;

public class SecurityOptions
{
    public const string SectionName = "Security";

    public JwtOptions Jwt { get; set; } = new();
    public SessionOptions Session { get; set; } = new();
    public Argon2Options Argon2 { get; set; } = new();
    public TotpOptions Totp { get; set; } = new();
    public RateLimitOptions RateLimit { get; set; } = new();
    public string AppUrl { get; set; } = "http://localhost:5173";
    public string[] AllowedOrigins { get; set; } = ["http://localhost:5173", "https://localhost:5173"];
    public bool EnforceHttps { get; set; } = false; // True em produção
}

public class JwtOptions
{
    public string Issuer { get; set; } = "InvestirGo";
    public string Audience { get; set; } = "InvestirGoClient";
    public string SecretKey { get; set; } = "InvestirGo_SuperSecret_SecurityKey_MustBeAtLeast32Bytes_2026";
    public int AccessTokenLifetimeMinutes { get; set; } = 10;
}

public class SessionOptions
{
    public int AbsoluteLifetimeDays { get; set; } = 7;
    public int InactivityLifetimeHours { get; set; } = 24;
    public int GraceWindowSeconds { get; set; } = 20; // Tolerância estrita para concorrência de abas
    public string CookieName { get; set; } = "__Host-investir_refresh";
    public string FallbackCookieName { get; set; } = "investir_refresh"; // Para quando não for HTTPS em dev local
}

public class Argon2Options
{
    // Recomendações OWASP atuais para Argon2id:
    // Memory: >= 19 MiB (19456 KiB) até 64 MiB (65536 KiB)
    // Iterations: >= 2 (usamos 3)
    // Parallelism: 4 threads
    public int MemorySizeKb { get; set; } = 65536; // 64 MB
    public int Iterations { get; set; } = 3;
    public int DegreeOfParallelism { get; set; } = 4;
    public int SaltSizeBytes { get; set; } = 16;
    public int HashSizeBytes { get; set; } = 32;
}

public class TotpOptions
{
    public string Issuer { get; set; } = "InvestirGo";
    // Chave de 32 bytes em Base64 para cifragem AES-256-GCM dos segredos TOTP no banco
    public string EncryptionKeyBase64 { get; set; } = "qZ3jN8wK1sL0vP9xT2yU5aB7cE4fH6mI8jK9oL1pQ3s=";
    public int StepSeconds { get; set; } = 30;
    public int TotpSize { get; set; } = 6;
    public int RecoveryCodesCount { get; set; } = 8;
}

public class RateLimitOptions
{
    public int LoginMaxAttempts { get; set; } = 5;
    public int LoginWindowMinutes { get; set; } = 15;
    public int RegisterMaxAttempts { get; set; } = 3;
    public int RegisterWindowHours { get; set; } = 1;
    public int ResetMaxAttempts { get; set; } = 3;
    public int ResetWindowHours { get; set; } = 1;
    public int RefreshMaxAttemptsPerMinute { get; set; } = 30;
    public int MfaMaxAttempts { get; set; } = 5;
    public int MfaWindowMinutes { get; set; } = 5;
}
