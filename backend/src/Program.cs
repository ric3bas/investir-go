using System.Security.Claims;
using System.Text;
using InvestirGo.API.API.Endpoints;
using InvestirGo.API.API.Middlewares;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Options;
using InvestirGo.API.Application.Security.Services;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.BackgroundJobs;
using InvestirGo.API.Infrastructure.Data;
using InvestirGo.API.Infrastructure.Repositories;
using InvestirGo.API.Infrastructure.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

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

// Em produção, segredos ausentes devem interromper a inicialização. Gerar uma
// chave fixa dentro do código faria todas as instalações compartilharem o mesmo segredo.
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(securityOptions.Jwt.SecretKey) ||
        securityOptions.Jwt.SecretKey.Contains("DevSecretKey", StringComparison.OrdinalIgnoreCase) ||
        Encoding.UTF8.GetByteCount(securityOptions.Jwt.SecretKey) < 32)
    {
        throw new InvalidOperationException(
            "Security__Jwt__SecretKey é obrigatório em produção e deve ter pelo menos 32 bytes.");
    }

    if (string.IsNullOrWhiteSpace(securityOptions.Totp.EncryptionKeyBase64))
    {
        throw new InvalidOperationException(
            "Security__Totp__EncryptionKeyBase64 é obrigatório em produção.");
    }
}

// ----------------------------------------------------------------------------
// 3. CORS Resiliente para SPA e API (Sem Wildcard com Credenciais)
// ----------------------------------------------------------------------------
var allowedOrigins = securityOptions.AllowedOrigins
    .Append(securityOptions.AppUrl)
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Where(origin => Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                     (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("StrictCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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
builder.Services.AddScoped<IRateLimiterService, PostgreSqlRateLimiterService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ISecurityAuditService, SecurityAuditService>();

// PostgreSQL é a única fonte de autenticação, sessões e dados financeiros.
builder.Services.AddScoped<IAuthRepository, PostgreSqlAuthRepository>();

// Repositórios da Carteira
builder.Services.AddScoped<IAtivoRepository, AtivoRepository>();
builder.Services.AddScoped<IOperacaoRepository, OperacaoRepository>();
builder.Services.AddScoped<IProventoRepository, ProventoRepository>();
builder.Services.AddScoped<ICarteiraService, CarteiraService>();
builder.Services.AddScoped<IApuracaoFiscalService, ApuracaoFiscalService>();
builder.Services.AddScoped<ImportacaoB3Service>();

// Serviços de Mercado Real
builder.Services.AddHttpClient<MarketDataService>();
builder.Services.AddHttpClient("AwesomeApi", client =>
{
    client.BaseAddress = new Uri("https://economia.awesomeapi.com.br/");
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddMemoryCache();
builder.Services.AddScoped<CotacaoAtualizacaoService>();
builder.Services.AddScoped<MercadoPainelService>();
builder.Services.AddHostedService<CotacaoBackgroundService>();

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
// 8. Pipeline de Middlewares de Segurança
// ----------------------------------------------------------------------------

// CORS resiliente deve ser o primeiro middleware para garantir que todas as respostas
// (incluindo preflights OPTIONS, rejeições de CSRF e erros de autenticação) contenham os cabeçalhos de CORS
app.UseCors("StrictCorsPolicy");

// Converte exceções não tratadas em uma resposta JSON segura. Como este
// middleware está depois do CORS, até falhas internas mantêm os cabeçalhos
// Access-Control-Allow-Origin/Allow-Credentials esperados pelo navegador.
app.UseExceptionHandler(exceptionHandler =>
{
    exceptionHandler.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        Log.Error(exception, "Falha não tratada em {Method} {Path}", context.Request.Method, context.Request.Path);

        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        await Results.Problem(
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Serviço temporariamente indisponível",
            detail: "Não foi possível concluir esta solicitação. Consulte o log da API usando o identificador da requisição.",
            extensions: new Dictionary<string, object?> { ["requestId"] = context.TraceIdentifier })
            .ExecuteAsync(context);
    });
});

// Cabeçalhos de Segurança (CSP, HSTS, X-Frame-Options, No-Cache em auth)
app.UseMiddleware<SecurityHeadersMiddleware>();

// Proteção CSRF e validação de Origin/Referer em endpoints com cookies
app.UseMiddleware<CsrfProtectionMiddleware>();

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
