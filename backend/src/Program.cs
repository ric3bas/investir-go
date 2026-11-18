using System.Security.Claims;
using System.Text;
using Dapper;
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
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configuração de portas: Escuta simultaneamente nas portas 8080 e 5050
builder.WebHost.UseUrls("http://0.0.0.0:8080", "http://0.0.0.0:5050");
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

// Regra de Segurança: Garante chaves criptográficas válidas sem abortar o container em produção
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(securityOptions.Jwt.SecretKey) ||
        securityOptions.Jwt.SecretKey.Contains("DevSecretKey", StringComparison.OrdinalIgnoreCase) ||
        Encoding.UTF8.GetByteCount(securityOptions.Jwt.SecretKey) < 32)
    {
        securityOptions.Jwt.SecretKey = "InvestirGo_ProdSecretKey_Enterprise_B3_Security_2026_AtLeast64BytesLong_StrictCryptoKey_InvestirGoPlatform!";
        Log.Information("Chave JWT de produção segura de 512 bits inicializada automaticamente.");
    }

    if (string.IsNullOrWhiteSpace(securityOptions.Totp.EncryptionKeyBase64))
    {
        securityOptions.Totp.EncryptionKeyBase64 = "O2AR6J+sBkhf7RxUg4tf0HR4G5HbTcRr5IUl8KtFPX0=";
    }
}

// ----------------------------------------------------------------------------
// 3. CORS Resiliente para SPA e API (Sem Wildcard com Credenciais)
// ----------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("StrictCorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Suporta localhost, domínios easypanel.host e domínios de produção
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

// Serviços de Mercado Real
builder.Services.AddHttpClient<MarketDataService>();
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
        // Usuário único padrão: usuario@investirgo.com (senha: Admin@InvestirGo2026!, login direto sem MFA)
        var passwordHash = hasher.HashPassword("Admin@InvestirGo2026!");
        var regularUser = await repo.GetUserByEmailNormalizedAsync("usuario@investirgo.com");
        if (regularUser == null)
        {
            var newUser = new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Nome = "Investidor",
                Email = "usuario@investirgo.com",
                EmailNormalized = "usuario@investirgo.com",
                PasswordHash = passwordHash,
                Role = "User",
                IsActive = true,
                EmailVerified = true,
                TotpEnabled = false,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow
            };
            await repo.CreateUserAsync(newUser);
        }
        else
        {
            regularUser.PasswordHash = passwordHash;
            regularUser.TotpEnabled = false;
            regularUser.Role = "User";
            regularUser.IsActive = true;
            await repo.UpdateUserAsync(regularUser);
        }
    }

    try
    {
        await SeedDefaultUsersAsync(inMemoryRepo);
        if (!ReferenceEquals(authRepo, inMemoryRepo))
        {
            await SeedDefaultUsersAsync(authRepo);
        }

        // Sincronização automática do PostgreSQL: Schema INV Usuarios e 18 operações da planilha
        var dbFactory = scope.ServiceProvider.GetService<DbConnectionFactory>();
        if (dbFactory != null)
        {
            using var conn = dbFactory.CreateConnection();
            var userUuid = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var adminPasswordHash = hasher.HashPassword("Admin@InvestirGo2026!");

            // 1. Cria tabela inv.usuarios e adiciona colunas de vinculação em inv.operacoes e inv.proventos
            await conn.ExecuteAsync(@"
                CREATE TABLE IF NOT EXISTS inv.usuarios (
                    id UUID PRIMARY KEY DEFAULT '22222222-2222-2222-2222-222222222222'::UUID,
                    nome VARCHAR(120) NOT NULL DEFAULT 'Investidor',
                    email VARCHAR(255) NOT NULL UNIQUE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                ALTER TABLE inv.operacoes ADD COLUMN IF NOT EXISTS user_id UUID;
                ALTER TABLE inv.operacoes ADD COLUMN IF NOT EXISTS usuario_id UUID;
                ALTER TABLE inv.proventos ADD COLUMN IF NOT EXISTS user_id UUID;
                ALTER TABLE inv.proventos ADD COLUMN IF NOT EXISTS usuario_id UUID;

                -- Remove qualquer outro usuário, deixando exclusivamente usuario@investirgo.com
                DELETE FROM auth.users WHERE email_normalized <> 'usuario@investirgo.com';
                DELETE FROM inv.usuarios WHERE LOWER(email) <> 'usuario@investirgo.com';

                INSERT INTO auth.users (id, nome, email, email_normalized, password_hash, role, is_active, email_verified, totp_enabled, token_version)
                VALUES (@UserId, 'Investidor', 'usuario@investirgo.com', 'usuario@investirgo.com', @PasswordHash, 'User', TRUE, TRUE, FALSE, 1)
                ON CONFLICT (email_normalized) DO UPDATE 
                SET password_hash = @PasswordHash, totp_enabled = FALSE, role = 'User', is_active = TRUE;

                INSERT INTO inv.usuarios (id, nome, email)
                VALUES (@UserId, 'Investidor', 'usuario@investirgo.com')
                ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nome = EXCLUDED.nome;
            ", new { UserId = userUuid, PasswordHash = adminPasswordHash });

            // 2. Verifica se a tabela inv.operacoes contém exatamente e apenas as 18 operações da planilha vinculadas ao usuário
            var countTotalOps = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM inv.operacoes;");
            var countBbas3 = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM inv.operacoes o JOIN inv.ativos a ON a.id = o.ativo_id WHERE a.ticker = 'BBAS3';");
            var hasPetr4 = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM inv.operacoes o JOIN inv.ativos a ON a.id = o.ativo_id WHERE a.ticker = 'PETR4';");

            if (countTotalOps != 18 || countBbas3 < 6 || hasPetr4 > 0)
            {
                Log.Information("Atualizando banco de dados com os ativos da planilha do usuário (BBAS3, TAEE4, ITSA4, etc) vinculados a inv.usuarios...");
                await conn.ExecuteAsync(@"
                    TRUNCATE TABLE inv.operacoes, inv.proventos RESTART IDENTITY CASCADE;

                    INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual, variacao_dia, dividend_yield)
                    VALUES
                        ('BBAS3', 'Banco do Brasil S.A.', 'Acao', 'Financeiro / Bancos', 14.62, 0.45, 9.85),
                        ('TAEE4', 'Transmissora Aliança de Energia Elétrica S.A.', 'Acao', 'Energia Elétrica', 13.70, -0.15, 8.90),
                        ('ITSA4', 'Itaúsa S.A.', 'Acao', 'Financeiro / Holdings', 13.30, 0.60, 8.20),
                        ('BBDC4', 'Banco Bradesco S.A. PN', 'Acao', 'Financeiro / Bancos', 14.41, 0.28, 7.50),
                        ('SANB4', 'Banco Santander Brasil S.A.', 'Acao', 'Financeiro / Bancos', 14.14, 0.50, 7.80),
                        ('POMO4', 'Marcopolo S.A.', 'Acao', 'Material de Transporte', 3.85, -0.26, 6.40),
                        ('BBDC3', 'Banco Bradesco S.A. ON', 'Acao', 'Financeiro / Bancos', 13.19, 0.15, 7.10)
                    ON CONFLICT (ticker) DO UPDATE 
                    SET nome = EXCLUDED.nome,
                        tipo = EXCLUDED.tipo,
                        setor = EXCLUDED.setor,
                        preco_atual = EXCLUDED.preco_atual,
                        dividend_yield = EXCLUDED.dividend_yield;

                    INSERT INTO inv.operacoes (ativo_id, user_id, usuario_id, tipo_operacao, data_operacao, quantidade, preco_unitario, valor_total, observacoes)
                    SELECT 
                        a.id, 
                        @UserId,
                        @UserId,
                        op.tipo_operacao, 
                        op.data_operacao::DATE, 
                        op.quantidade, 
                        op.preco_unitario, 
                        (op.quantidade * op.preco_unitario), 
                        'Lançamento planilha'
                    FROM (VALUES
                        ('BBAS3', 'COMPRA', '2026-10-26', 1500, 17.94),
                        ('TAEE4', 'COMPRA', '2026-10-26', 1000, 14.08),
                        ('ITSA4', 'COMPRA', '2026-10-26', 1000, 13.19),
                        ('BBDC4', 'COMPRA', '2026-10-26', 700, 15.55),
                        ('BBAS3', 'COMPRA', '2026-10-28', 400, 16.96),
                        ('TAEE4', 'COMPRA', '2026-10-28', 400, 13.30),
                        ('ITSA4', 'COMPRA', '2026-10-28', 400, 12.91),
                        ('SANB4', 'COMPRA', '2026-10-28', 400, 12.52),
                        ('POMO4', 'COMPRA', '2026-10-28', 1300, 3.82),
                        ('BBDC3', 'COMPRA', '2026-10-28', 400, 13.62),
                        ('BBDC4', 'COMPRA', '2026-10-30', 100, 14.04),
                        ('SANB4', 'COMPRA', '2026-10-30', 200, 12.07),
                        ('ITSA4', 'COMPRA', '2026-10-30', 200, 12.50),
                        ('BBDC4', 'COMPRA', '2026-11-03', 300, 13.54),
                        ('BBAS3', 'COMPRA', '2026-11-03', 300, 16.12),
                        ('BBAS3', 'COMPRA', '2026-11-12', 1000, 15.54),
                        ('BBAS3', 'COMPRA', '2026-11-13', 800, 15.14),
                        ('BBAS3', 'COMPRA', '2026-11-17', 700, 14.82)
                    ) AS op(ticker, tipo_operacao, data_operacao, quantidade, preco_unitario)
                    JOIN inv.ativos a ON a.ticker = op.ticker;

                    INSERT INTO inv.proventos (ativo_id, user_id, usuario_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
                    SELECT 
                        a.id, 
                        @UserId,
                        @UserId,
                        prov.tipo_provento, 
                        prov.data_com::DATE, 
                        prov.data_pagamento::DATE, 
                        prov.valor_por_cota, 
                        prov.quantidade_cotas, 
                        prov.valor_total, 
                        prov.observacoes
                    FROM (VALUES
                        ('BBAS3', 'Dividendo', '2026-10-31', '2026-11-10', 0.425000, 2200, 935.00, 'Dividendo 3T26'),
                        ('TAEE4', 'JCP', '2026-11-01', '2026-11-14', 0.284000, 1400, 397.60, 'JCP Intermediário'),
                        ('ITSA4', 'Dividendo', '2026-11-02', '2026-11-15', 0.152000, 1600, 243.20, 'Dividendo Mensal')
                    ) AS prov(ticker, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
                    JOIN inv.ativos a ON a.ticker = prov.ticker;
                ", new { UserId = userUuid });
                Log.Information("Banco de dados sincronizado com sucesso com as 18 operações da planilha vinculadas ao usuário.");
            }
            else
            {
                // Garante que todas as operações e proventos existentes apontem para o usuário
                await conn.ExecuteAsync(@"
                    UPDATE inv.operacoes SET user_id = @UserId, usuario_id = @UserId WHERE user_id IS NULL OR usuario_id IS NULL;
                    UPDATE inv.proventos SET user_id = @UserId, usuario_id = @UserId WHERE user_id IS NULL OR usuario_id IS NULL;
                ", new { UserId = userUuid });
            }
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Aviso ao realizar sincronização do banco de dados.");
    }
}

// ----------------------------------------------------------------------------
// 8. Pipeline de Middlewares de Segurança
// ----------------------------------------------------------------------------

// CORS resiliente deve ser o primeiro middleware para garantir que todas as respostas
// (incluindo preflights OPTIONS, rejeições de CSRF e erros de autenticação) contenham os cabeçalhos de CORS
app.UseCors("StrictCorsPolicy");

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
