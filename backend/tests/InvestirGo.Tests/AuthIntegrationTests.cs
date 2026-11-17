using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Services;
using InvestirGo.API.Domain.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using OtpNet;

namespace InvestirGo.Tests;

[CollectionDefinition("AuthTests", DisableParallelization = true)]
public class AuthTestsCollection : ICollectionFixture<TestWebApplicationFactory>
{
}

[Collection("AuthTests")]
public class AuthIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuthIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateTestClient(int testId)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            BaseAddress = new Uri("http://localhost:5050")
        });
        client.DefaultRequestHeaders.Add("Origin", "http://localhost:5173");
        client.DefaultRequestHeaders.Add("X-Forwarded-For", $"192.168.1.{testId}");
        return client;
    }

    private async Task<User> CreateTestUserAsync(string email, string password = "User@InvestirGo2026!", string role = "User")
    {
        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var existing = await repo.GetUserByEmailNormalizedAsync(email.ToLowerInvariant());
        if (existing != null) return existing;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Nome = "Test User " + email,
            Email = email,
            EmailNormalized = email.ToLowerInvariant(),
            PasswordHash = hasher.HashPassword(password),
            Role = role,
            IsActive = true,
            EmailVerified = true,
            TokenVersion = 1,
            CreatedAt = DateTime.UtcNow
        };
        return await repo.CreateUserAsync(user);
    }

    // ------------------------------------------------------------------------
    // 1. Login Válido e Inválido (Respostas Genéricas e Mitigação de Enumeração)
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test01_Login_ValidAndInvalidCredentials()
    {
        var client = CreateTestClient(1);
        var testUser = await CreateTestUserAsync("user_login_t1@investirgo.com");

        // 1. Login com credenciais válidas de usuário comum
        var validLogin = new LoginRequestDto(testUser.Email, "User@InvestirGo2026!");
        var responseSuccess = await client.PostAsJsonAsync("/api/auth/login", validLogin);

        Assert.Equal(HttpStatusCode.OK, responseSuccess.StatusCode);
        var loginResult = await responseSuccess.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(loginResult);
        Assert.False(loginResult.RequiresMfa);
        Assert.NotNull(loginResult.AccessToken);
        Assert.NotNull(loginResult.User);
        Assert.Equal(testUser.Email, loginResult.User.Email);

        // Verifica presença do cookie HttpOnly
        Assert.True(responseSuccess.Headers.Contains("Set-Cookie"));
        var cookies = responseSuccess.Headers.GetValues("Set-Cookie").ToList();
        Assert.Contains(cookies, c => c.Contains("investir_refresh") && c.Contains("httponly", StringComparison.OrdinalIgnoreCase));

        // 2. Login com senha incorreta
        var invalidPasswordLogin = new LoginRequestDto(testUser.Email, "SenhaErrada123!");
        var responseBadPass = await client.PostAsJsonAsync("/api/auth/login", invalidPasswordLogin);
        Assert.Equal(HttpStatusCode.Unauthorized, responseBadPass.StatusCode);

        // 3. Login com conta inexistente (deve responder com 401 idêntico)
        var nonExistentLogin = new LoginRequestDto("inexistente_xyz@investirgo.com", "QualquerSenha123!");
        var responseNonExistent = await client.PostAsJsonAsync("/api/auth/login", nonExistentLogin);
        Assert.Equal(HttpStatusCode.Unauthorized, responseNonExistent.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 2. Expiração e Validação dos Tokens (JWT)
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test02_AccessToken_ValidationAndExpiration()
    {
        var client = CreateTestClient(2);
        var testUser = await CreateTestUserAsync("user_jwt_t2@investirgo.com");

        // 1. Login para obter token válido
        var login = new LoginRequestDto(testUser.Email, "User@InvestirGo2026!");
        var loginResp = await client.PostAsJsonAsync("/api/auth/login", login);
        var loginData = await loginResp.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData!.AccessToken);
        var meResp = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, meResp.StatusCode);

        // 2. Token adulterado / assinatura inválida
        using var requestTampered = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        requestTampered.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData.AccessToken + "tampered");
        var tamperedResp = await client.SendAsync(requestTampered);
        Assert.Equal(HttpStatusCode.Unauthorized, tamperedResp.StatusCode);

        // 3. Token com algoritmo 'none' ou formato inválido
        using var requestNone = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        requestNone.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.e30.");
        var noneResp = await client.SendAsync(requestNone);
        Assert.Equal(HttpStatusCode.Unauthorized, noneResp.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 3. Rotação de Refresh Token
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test03_RefreshToken_Rotation()
    {
        var client = CreateTestClient(3);
        var testUser = await CreateTestUserAsync("user_refresh_t3@investirgo.com");

        // Login inicial
        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(testUser.Email, "User@InvestirGo2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);
        var firstCookies = loginResp.Headers.GetValues("Set-Cookie").First(c => c.Contains("investir_refresh"));

        // Executa rotação (/api/auth/refresh)
        var refreshResp = await client.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, refreshResp.StatusCode);

        var refreshData = await refreshResp.Content.ReadFromJsonAsync<RefreshTokenResponseDto>(_jsonOptions);
        Assert.NotNull(refreshData);
        Assert.NotNull(refreshData.AccessToken);

        // Verifica que um novo cookie de refresh token foi gerado na rotação
        Assert.True(refreshResp.Headers.Contains("Set-Cookie"));
        var secondCookies = refreshResp.Headers.GetValues("Set-Cookie").First(c => c.Contains("investir_refresh"));
        Assert.NotEqual(firstCookies, secondCookies);
    }

    // ------------------------------------------------------------------------
    // 4. Reutilização de Refresh Token e Revogação da Família
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test04_RefreshToken_ReuseDetectionAndFamilyRevocation()
    {
        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        var user = await CreateTestUserAsync("user_family_t4@investirgo.com");
        var familyId = Guid.NewGuid();

        string token1 = tokenService.GenerateOpaqueToken();
        string token1Hash = tokenService.ComputeSha256Hash(token1);

        string token2 = tokenService.GenerateOpaqueToken();
        string token2Hash = tokenService.ComputeSha256Hash(token2);

        // Cria sessão já rotacionada no passado (fora da janela de concorrência)
        var session = new UserSession
        {
            UserId = user.Id,
            SessionFamilyId = familyId,
            RefreshTokenHash = token2Hash,
            PreviousTokenHash = token1Hash,
            PreviousTokenRotatedAt = DateTime.UtcNow.AddMinutes(-5), // 5 minutos atrás (fora da janela de graça de 5s)
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IdleExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            LastActiveAt = DateTime.UtcNow.AddMinutes(-5)
        };
        await repo.CreateSessionAsync(session);

        // Atacante tenta reutilizar token1 (que já foi substituído)
        var clientAttacker = CreateTestClient(41);
        clientAttacker.DefaultRequestHeaders.Add("Cookie", $"investir_refresh={token1}");

        var reuseResponse = await clientAttacker.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);

        // Verifica que toda a família de sessões foi revogada
        var updatedSession = await repo.GetSessionByIdAsync(session.Id);
        Assert.NotNull(updatedSession);
        Assert.True(updatedSession.IsRevoked);
        Assert.Equal("TOKEN_REUSE_DETECTED", updatedSession.RevokedReason);

        // Tentativa de usar até mesmo o token legítimo token2 da mesma família agora falha
        var clientVictim = CreateTestClient(42);
        clientVictim.DefaultRequestHeaders.Add("Cookie", $"investir_refresh={token2}");

        var victimResponse = await clientVictim.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, victimResponse.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 5. Refresh Concorrente (Janela de Tolerância de Abas)
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test05_RefreshToken_ConcurrentGraceWindow()
    {
        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        var user = await CreateTestUserAsync("user_concurrent_t5@investirgo.com");
        var familyId = Guid.NewGuid();

        string token1 = tokenService.GenerateOpaqueToken();
        string token1Hash = tokenService.ComputeSha256Hash(token1);
        string token2 = tokenService.GenerateOpaqueToken();
        string token2Hash = tokenService.ComputeSha256Hash(token2);

        // Simula rotação ocorrida há apenas 1 segundo (dentro da janela de tolerância de concorrência)
        var session = new UserSession
        {
            UserId = user.Id,
            SessionFamilyId = familyId,
            RefreshTokenHash = token2Hash,
            PreviousTokenHash = token1Hash,
            PreviousTokenRotatedAt = DateTime.UtcNow.AddSeconds(-1),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IdleExpiresAt = DateTime.UtcNow.AddHours(24),
            IpAddress = "192.168.1.5",
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow
        };
        await repo.CreateSessionAsync(session);

        var clientTab = CreateTestClient(5);
        clientTab.DefaultRequestHeaders.Add("Cookie", $"investir_refresh={token1}");

        // Requisição da aba concorrente dentro da janela de graça deve ser aceita sem revogar a família
        var graceResponse = await clientTab.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, graceResponse.StatusCode);

        var refreshedSession = await repo.GetSessionByIdAsync(session.Id);
        Assert.False(refreshedSession!.IsRevoked);
    }

    // ------------------------------------------------------------------------
    // 6. Logout e Logout de Todas as Sessões
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test06_Logout_CurrentSessionAndAllSessions()
    {
        var testUser = await CreateTestUserAsync("user_logout_t6@investirgo.com");
        var client = CreateTestClient(6);

        // 1. Logout da sessão atual
        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(testUser.Email, "User@InvestirGo2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);
        var logoutResp = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutResp.StatusCode);

        // Tentar refresh com o cookie revogado deve falhar
        var refreshAfterLogout = await client.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshAfterLogout.StatusCode);

        // 2. Logout de todas as sessões
        var client2 = CreateTestClient(62);

        var loginResp2 = await client2.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(testUser.Email, "User@InvestirGo2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResp2.StatusCode);
        var loginData2 = await loginResp2.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(loginData2);

        using var logoutAllReq = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout-all");
        logoutAllReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData2.AccessToken);
        var logoutAllResp = await client2.SendAsync(logoutAllReq);
        Assert.Equal(HttpStatusCode.OK, logoutAllResp.StatusCode);

        // O token JWT anterior agora deve falhar mesmo dentro dos 10 minutos (devido ao incremento de TokenVersion)
        using var checkOldJwtReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        checkOldJwtReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData2.AccessToken);
        var checkOldJwtResp = await client2.SendAsync(checkOldJwtReq);
        Assert.Equal(HttpStatusCode.Unauthorized, checkOldJwtResp.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 7. Revogação após Redefinição de Senha
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test07_Revocation_AfterPasswordReset()
    {
        var client = CreateTestClient(7);
        var testUser = await CreateTestUserAsync("user_reset_t7@investirgo.com");

        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        string oldAccessToken = tokenService.GenerateAccessToken(testUser, Guid.NewGuid());

        // Gera token de redefinição
        string resetRaw = tokenService.GenerateOpaqueToken();
        string resetHash = tokenService.ComputeSha256Hash(resetRaw);
        await repo.CreateTokenAsync(new UserToken
        {
            UserId = testUser.Id,
            TokenType = "PASSWORD_RESET",
            TokenHash = resetHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        });

        // Executa redefinição de senha
        var resetResp = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto(resetRaw, "NovaSenhaForte2026!#"));
        Assert.Equal(HttpStatusCode.OK, resetResp.StatusCode);

        // O access token emitido antes da redefinição deve ser rejeitado imediatamente
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", oldAccessToken);
        var meResp = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Unauthorized, meResp.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 8. Bloqueio de Conta Desativada
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test08_DeactivatedUser_BlockedFromLoginAndExistingTokensInvalidated()
    {
        var client = CreateTestClient(8);
        var testUser = await CreateTestUserAsync("user_deact_t8@investirgo.com");

        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        string accessToken = tokenService.GenerateAccessToken(testUser, Guid.NewGuid());

        // Desativa a conta do usuário
        testUser.IsActive = false;
        await repo.UpdateUserAsync(testUser);

        // 1. Login deve ser bloqueado com 403 Forbidden
        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(testUser.Email, "User@InvestirGo2026!"));
        Assert.Equal(HttpStatusCode.Forbidden, loginResp.StatusCode);

        // 2. Token de acesso previamente emitido é rejeitado em tempo real
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var meResp = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Unauthorized, meResp.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 9. Proteção CSRF e Política de CORS
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test09_CsrfProtection_And_CorsPolicy()
    {
        var clientMalicious = _factory.CreateClient();
        // Origem não permitida
        clientMalicious.DefaultRequestHeaders.Add("Origin", "https://site-atacante-malicioso.com");
        clientMalicious.DefaultRequestHeaders.Add("Cookie", "investir_refresh=qualquer_token");

        var responseCors = await clientMalicious.PostAsync("/api/auth/refresh", null);
        // Deve ser barrado pelo middleware CSRF/Origin com 403 Forbidden
        Assert.Equal(HttpStatusCode.Forbidden, responseCors.StatusCode);

        // Double submit CSRF token inválido
        var clientCsrfMismatch = _factory.CreateClient();
        clientCsrfMismatch.DefaultRequestHeaders.Add("Origin", "http://localhost:5173");
        clientCsrfMismatch.DefaultRequestHeaders.Add("Cookie", "investir_refresh=token; XSRF-TOKEN=valor_esperado");
        clientCsrfMismatch.DefaultRequestHeaders.Add("X-CSRF-Token", "valor_falsificado");

        var responseCsrf = await clientCsrfMismatch.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Forbidden, responseCsrf.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 10. Rate Limiting
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test10_RateLimiting_Enforcement()
    {
        var customClient = _factory.CreateClient();
        customClient.DefaultRequestHeaders.Add("Origin", "http://localhost:5173");
        customClient.DefaultRequestHeaders.Add("X-Forwarded-For", "203.0.113.110");

        var badLogin = new LoginRequestDto("usuario_rate_limit@investirgo.com", "SenhaIncorreta123!");
        HttpResponseMessage lastResponse = null!;

        // Realiza 12 tentativas de login incorretas consecutivas
        for (int i = 0; i < 12; i++)
        {
            lastResponse = await customClient.PostAsJsonAsync("/api/auth/login", badLogin);
        }

        // Deve atingir o limite e responder com 429 Too Many Requests
        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse.StatusCode);
        Assert.True(lastResponse.Headers.Contains("Retry-After"));
    }

    // ------------------------------------------------------------------------
    // 11. Recuperação com Token Expirado ou Já Utilizado
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test11_AccountRecovery_ExpiredOrAlreadyUsedToken()
    {
        var client = CreateTestClient(11);
        var testUser = await CreateTestUserAsync("user_recovery_t11@investirgo.com");

        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        // 1. Token já consumido
        string tokenRaw = tokenService.GenerateOpaqueToken();
        string tokenHash = tokenService.ComputeSha256Hash(tokenRaw);
        await repo.CreateTokenAsync(new UserToken
        {
            UserId = testUser.Id,
            TokenType = "PASSWORD_RESET",
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        });

        // Primeiro consumo: sucesso
        var firstUse = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto(tokenRaw, "NovaSenhaValida123!#"));
        Assert.Equal(HttpStatusCode.OK, firstUse.StatusCode);

        // Segundo consumo: deve falhar (400 Bad Request)
        var secondUse = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto(tokenRaw, "OutraSenhaValida123!#"));
        Assert.Equal(HttpStatusCode.BadRequest, secondUse.StatusCode);

        // 2. Token expirado
        string expiredTokenRaw = tokenService.GenerateOpaqueToken();
        string expiredTokenHash = tokenService.ComputeSha256Hash(expiredTokenRaw);
        await repo.CreateTokenAsync(new UserToken
        {
            UserId = testUser.Id,
            TokenType = "PASSWORD_RESET",
            TokenHash = expiredTokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10) // Expirado há 10 minutos
        });

        var expiredUse = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto(expiredTokenRaw, "TentativaComTokenExpirado123!"));
        Assert.Equal(HttpStatusCode.BadRequest, expiredUse.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 12. MFA por TOTP e Códigos de Recuperação
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test12_Mfa_TotpVerificationAndSingleUseRecoveryCodes()
    {
        var client = CreateTestClient(12);

        using var scope = _factory.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var totpService = scope.ServiceProvider.GetRequiredService<ITotpService>();

        var admin = await repo.GetUserByEmailNormalizedAsync("admin@investirgo.com");

        // 1. Admin login exige desafio MFA
        var adminLoginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin@investirgo.com", "Admin@InvestirGo2026!"));
        Assert.Equal(HttpStatusCode.OK, adminLoginResp.StatusCode);
        var mfaChallenge = await adminLoginResp.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.True(mfaChallenge!.RequiresMfa);
        Assert.NotNull(mfaChallenge.MfaToken);

        // 2. Validação do código TOTP com RFC 6238
        string plainSecret = totpService.DecryptSecret(admin!.TotpSecretEncrypted!);
        var totp = new Totp(Base32Encoding.ToBytes(plainSecret));
        string validTotpCode = totp.ComputeTotp();

        var mfaVerifyResp = await client.PostAsJsonAsync("/api/auth/mfa/verify", new MfaVerifyRequestDto(mfaChallenge.MfaToken, validTotpCode));
        Assert.Equal(HttpStatusCode.OK, mfaVerifyResp.StatusCode);
        var authSuccess = await mfaVerifyResp.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);
        Assert.NotNull(authSuccess!.AccessToken);

        // 3. Teste de Código de Recuperação (Backup Code)
        var recoveryCodes = totpService.GenerateRecoveryCodes(1);
        string testCode = recoveryCodes[0];
        string testCodeHash = totpService.HashRecoveryCode(testCode);
        await repo.SaveRecoveryCodesAsync(admin.Id, [testCodeHash]);

        // Gera novo desafio
        var login2Resp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin@investirgo.com", "Admin@InvestirGo2026!"));
        var challenge2 = await login2Resp.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);

        // Consome código de recuperação com sucesso
        var backupVerifyResp = await client.PostAsJsonAsync("/api/auth/mfa/verify", new MfaVerifyRequestDto(challenge2!.MfaToken!, testCode, IsRecoveryCode: true));
        Assert.Equal(HttpStatusCode.OK, backupVerifyResp.StatusCode);

        // Tentativa de reutilizar o mesmo código de recuperação deve falhar
        var login3Resp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin@investirgo.com", "Admin@InvestirGo2026!"));
        var challenge3 = await login3Resp.Content.ReadFromJsonAsync<LoginResponseDto>(_jsonOptions);

        var reuseBackupResp = await client.PostAsJsonAsync("/api/auth/mfa/verify", new MfaVerifyRequestDto(challenge3!.MfaToken!, testCode, IsRecoveryCode: true));
        Assert.Equal(HttpStatusCode.BadRequest, reuseBackupResp.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 13. Acesso Indevido a Recursos de Outro Usuário (IDOR)
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test13_ResourceAuthorization_IdorProtection()
    {
        var client = CreateTestClient(13);

        using var scope = _factory.Services.CreateScope();
        var operacaoRepo = scope.ServiceProvider.GetRequiredService<IOperacaoRepository>();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        var userA = await CreateTestUserAsync("user_idor_a@investirgo.com");

        // Cria operação pertencente ao Usuário A
        var opUserA = new Operacao
        {
            AtivoId = 1,
            UserId = userA.Id,
            Ticker = "PETR4",
            TipoOperacao = "COMPRA",
            Quantidade = 100,
            PrecoUnitario = 38.50m,
            ValorTotal = 3850m,
            DataOperacao = DateTime.UtcNow
        };
        int opId = await operacaoRepo.CriarAsync(opUserA);

        // Cria Usuário B
        var userB = await CreateTestUserAsync("user_idor_b@investirgo.com");
        string tokenUserB = tokenService.GenerateAccessToken(userB, Guid.NewGuid());

        // Usuário B tenta acessar recurso de Usuário A
        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/operacoes/{opId}");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenUserB);
        var getResp = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.Forbidden, getResp.StatusCode);

        // Usuário B tenta excluir recurso de Usuário A
        using var delReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/operacoes/{opId}");
        delReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenUserB);
        var delResp = await client.SendAsync(delReq);
        Assert.Equal(HttpStatusCode.Forbidden, delResp.StatusCode);
    }

    // ------------------------------------------------------------------------
    // 14. Atributos dos Cookies e Ausência de Tokens Sensíveis nas Respostas JSON
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test14_CookieSecurityAttributes_And_NoSensitiveDataInResponse()
    {
        var client = CreateTestClient(14);
        var testUser = await CreateTestUserAsync("user_cookie_t14@investirgo.com");

        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(testUser.Email, "User@InvestirGo2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);

        // 1. Verifica atributos estritos do Cookie Set-Cookie
        Assert.True(loginResp.Headers.Contains("Set-Cookie"));
        string cookieHeader = loginResp.Headers.GetValues("Set-Cookie").First(c => c.Contains("investir_refresh"));

        Assert.Contains("httponly", cookieHeader, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", cookieHeader, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/api/auth", cookieHeader, StringComparison.OrdinalIgnoreCase);

        // 2. Verifica corpo JSON da resposta: NUNCA deve retornar o refresh token
        string jsonBody = await loginResp.Content.ReadAsStringAsync();
        Assert.DoesNotContain("refreshToken", jsonBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("refresh_token", jsonBody, StringComparison.OrdinalIgnoreCase);

        // 3. Verifica cabeçalhos de segurança (CSP, X-Content-Type-Options, No-Cache)
        Assert.True(loginResp.Headers.Contains("X-Content-Type-Options"));
        Assert.Equal("nosniff", loginResp.Headers.GetValues("X-Content-Type-Options").First());

        Assert.True(loginResp.Headers.Contains("X-Frame-Options"));
        Assert.Equal("DENY", loginResp.Headers.GetValues("X-Frame-Options").First());

        var cacheControl = loginResp.Headers.CacheControl;
        Assert.NotNull(cacheControl);
        Assert.True(cacheControl.NoStore);
        Assert.True(cacheControl.NoCache);
    }
}
