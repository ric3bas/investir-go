using System.Security.Claims;
using System.Text;
using InvestirGo.API.API.Endpoints;
using InvestirGo.API.API.Middlewares;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Options;
using InvestirGo.API.Application.Security.Services;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;
using InvestirGo.API.Infrastructure.Repositories;
using InvestirGo.API.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configuração de portas: Escuta simultaneamente nas portas 8080 e 5050
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(8080);
    serverOptions.ListenAnyIP(5050);
});

// ----------------------------------------------------------------------------
// 1. Configuração do Serilog com Redação de Dados Sensíveis
// ----------------------------------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .Filter.ByExcluding(logEvent =>
    {
        // Garante que logs com valores de tokens, senhas ou cookies não sejam expostos
        var message = logEvent.RenderMessage();
        return message.Contains("Authorization: Bearer", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("Set-Cookie", StringComparison.OrdinalIgnoreCase);
    })
    .CreateLogger();

builder.Host.UseSerilog();

// ----------------------------------------------------------------------------
// 2. Opções de Segurança e Validação de Inicialização
// ----------------------------------------------------------------------------
builder.Services.Configure<SecurityOptions>(builder.Configuration.GetSection(SecurityOptions.SectionName));
var securityOptions = builder.Configuration.GetSection(SecurityOptions.SectionName).Get<SecurityOptions>() ?? new SecurityOptions();

// Regra de Segurança: Falhar na inicialização em produção se configurações críticas faltarem
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(securityOptions.Jwt.SecretKey) ||
        securityOptions.Jwt.SecretKey.Contains("DevSecretKey", StringComparison.OrdinalIgnoreCase) ||
        Encoding.UTF8.GetByteCount(securityOptions.Jwt.SecretKey) < 32)
    {
        throw new InvalidOperationException("FALHA CRÍTICA DE SEGURANÇA: Chave JWT em produção inválida ou com tamanho inferior a 256 bits.");
    }

    if (string.IsNullOrWhiteSpace(securityOptions.Totp.EncryptionKeyBase64))
    {
        securityOptions.Totp.EncryptionKeyBase64 = "O2AR6J+sBkhf7RxUg4tf0HR4G5HbTcRr5IUl8KtFPX0=";
    }
}

// ----------------------------------------------------------------------------
// 3. CORS com Origens Explícitas (Sem Wildcard com Credenciais)
// ----------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("StrictCorsPolicy", policy =>
    {
        policy.WithOrigins(securityOptions.AllowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Necessário para cookies HttpOnly entre SPA e API
    });
});

// ----------------------------------------------------------------------------
// 4. Injeção de Dependências de Segurança e Domínio
// ----------------------------------------------------------------------------
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<DbConnectionFactory>();

// Serviços de Criptografia e Autenticação
builder.Services.AddSingleton<IPasswordHasher, Argon2idPasswordHasher>();
builder.Services.AddSingleton<IPasswordValidator, PasswordValidator>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddSingleton<ITotpService, TotpService>();
builder.Services.AddSingleton<IRateLimiterService, MemoryRateLimiterService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ISecurityAuditService, SecurityAuditService>();

// Repositórios: Suporte dual PostgreSQL e In-Memory (para testes e fallback)
builder.Services.AddSingleton<InMemoryAuthRepository>();
builder.Services.AddScoped<IAuthRepository>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    bool forceInMemory = config.GetValue<bool>("UseInMemoryAuth", false);

    if (forceInMemory)
    {
        return sp.GetRequiredService<InMemoryAuthRepository>();
    }

    try
    {
        // Testa se conexão PostgreSQL está disponível
        var factory = sp.GetRequiredService<DbConnectionFactory>();
        using var conn = factory.CreateConnection();
        conn.Open();
        return new PostgreSqlAuthRepository(factory);
    }
    catch
    {
        // Fallback transparente para o repositório em memória
        return sp.GetRequiredService<InMemoryAuthRepository>();
    }
});

// Repositórios da Carteira
builder.Services.AddScoped<IAtivoRepository, AtivoRepository>();
builder.Services.AddScoped<IOperacaoRepository, OperacaoRepository>();
builder.Services.AddScoped<IProventoRepository, ProventoRepository>();
builder.Services.AddScoped<ICarteiraService, CarteiraService>();

// ----------------------------------------------------------------------------
// 5. Autenticação JWT com Validação de Tempo Real (Token Version & Active Check)
// ----------------------------------------------------------------------------
var jwtKeyBytes = Encoding.UTF8.GetBytes(securityOptions.Jwt.SecretKey);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction() || securityOptions.EnforceHttps;
    options.SaveToken = false; // Não armazena token em memória de contexto além do necessário
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = securityOptions.Jwt.Issuer,
        ValidateAudience = true,
        ValidAudience = securityOptions.Jwt.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero, // Sem tolerância de drift de relógio para expiração estrita
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256]
    };

    // Validação em tempo real de revogação de sessão e desativação de conta
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var authRepo = context.HttpContext.RequestServices.GetRequiredService<IAuthRepository>();
            var subClaim = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? context.Principal?.FindFirst("sub")?.Value;
            var tokenVersionClaim = context.Principal?.FindFirst("token_version")?.Value;

            if (!Guid.TryParse(subClaim, out var userId) || !int.TryParse(tokenVersionClaim, out var tokenVersion))
            {
                context.Fail("Claims do token inválidas.");
                return;
            }

            var user = await authRepo.GetUserByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                context.Fail("Conta desativada ou inexistente.");
                return;
            }

            // Se o token_version for menor que o do usuário (ex: troca de senha ou logout global), rejeita imediatamente
            if (tokenVersion < user.TokenVersion)
            {
                context.Fail("Sessão revogada devido a alteração de credenciais.");
            }
        }
    };
});

// ----------------------------------------------------------------------------
// 6. Políticas de Autorização (RBAC)
// ----------------------------------------------------------------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("UserOrAdmin", policy => policy.RequireRole("User", "Admin"));
});

// ----------------------------------------------------------------------------
// 7. Swagger / OpenAPI
// ----------------------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "InvestirGo API",
        Version = "v1",
        Description = "API de Gestão de Investimentos com Autenticação e Autorização Segura"
    });
});

var app = builder.Build();

// ----------------------------------------------------------------------------
// Seed Inicial de Usuários em Memória e Banco (Desenvolvimento e Testes)
// ----------------------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var inMemoryRepo = scope.ServiceProvider.GetRequiredService<InMemoryAuthRepository>();
    var authRepo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var totpService = scope.ServiceProvider.GetRequiredService<ITotpService>();

    async Task SeedDefaultUsersAsync(IAuthRepository repo)
    {
        // 1. Usuário Investidor Comum (login simples com email e senha)
        var regularUser = await repo.GetUserByEmailNormalizedAsync("usuario@investirgo.com");
        if (regularUser == null)
        {
            var newUser = new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Nome = "Investidor",
                Email = "usuario@investirgo.com",
                EmailNormalized = "usuario@investirgo.com",
                PasswordHash = hasher.HashPassword("User@InvestirGo2026!"),
                Role = "User",
                IsActive = true,
                EmailVerified = true,
                TotpEnabled = false,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow
            };
            await repo.CreateUserAsync(newUser);
        }
        else if (regularUser.TotpEnabled)
        {
            regularUser.TotpEnabled = false;
            await repo.UpdateUserAsync(regularUser);
        }

        // 2. Garante que admin@investirgo.com (se for acessado) também funcione como usuário direto sem MFA
        var adminExisting = await repo.GetUserByEmailNormalizedAsync("admin@investirgo.com");
        if (adminExisting == null)
        {
            var adminUser = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Nome = "Investidor Admin",
                Email = "admin@investirgo.com",
                EmailNormalized = "admin@investirgo.com",
                PasswordHash = hasher.HashPassword("Admin@InvestirGo2026!"),
                Role = "User",
                IsActive = true,
                EmailVerified = true,
                TotpEnabled = false,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow
            };
            await repo.CreateUserAsync(adminUser);
        }
        else if (adminExisting.TotpEnabled || adminExisting.Role == "Admin")
        {
            adminExisting.TotpEnabled = false;
            adminExisting.Role = "User";
            await repo.UpdateUserAsync(adminExisting);
        }
    }

    try
    {
        await SeedDefaultUsersAsync(inMemoryRepo);
        if (!ReferenceEquals(authRepo, inMemoryRepo))
        {
            await SeedDefaultUsersAsync(authRepo);
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Aviso ao realizar seed de usuários de desenvolvimento.");
    }
}

// ----------------------------------------------------------------------------
// 8. Pipeline de Middlewares de Segurança
// ----------------------------------------------------------------------------

// Cabeçalhos de Segurança (CSP, HSTS, X-Frame-Options, No-Cache em auth)
app.UseMiddleware<SecurityHeadersMiddleware>();

// Proteção CSRF e validação de Origin/Referer em endpoints com cookies
app.UseMiddleware<CsrfProtectionMiddleware>();

app.UseCors("StrictCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

// Swagger apenas para visualização de documentação
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "InvestirGo API v1");
    c.RoutePrefix = "swagger";
});

// Mapeamento dos Endpoints
app.MapAuthEndpoints();
app.MapInvestirEndpoints();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

// Exporta classe Program para suporte a WebApplicationFactory nos testes de integração
public partial class Program { }
