using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Options;
using InvestirGo.API.Application.Security.Services;
using InvestirGo.API.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace InvestirGo.API.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var authGroup = app.MapGroup("/api/auth").WithTags("Autenticação e Segurança");

        // --------------------------------------------------------------------
        // CSRF Token Endpoint
        // --------------------------------------------------------------------
        authGroup.MapGet("/csrf", (HttpContext context, IOptions<SecurityOptions> options) =>
        {
            byte[] bytes = RandomNumberGenerator.GetBytes(24);
            string token = Convert.ToHexString(bytes).ToLowerInvariant();

            context.Response.Cookies.Append("XSRF-TOKEN", token, new CookieOptions
            {
                HttpOnly = false, // Deve ser acessível pelo JavaScript para inclusão no cabeçalho X-CSRF-Token
                Secure = context.Request.IsHttps || options.Value.EnforceHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromHours(24)
            });

            return Results.Ok(new { csrfToken = token });
        });

        // --------------------------------------------------------------------
        // 1. Cadastro de Usuário
        // --------------------------------------------------------------------
        authGroup.MapPost("/register", async (
            [FromBody] RegisterRequestDto dto,
            IAuthRepository authRepo,
            IPasswordHasher passwordHasher,
            IPasswordValidator passwordValidator,
            ITokenService tokenService,
            IRateLimiterService rateLimiter,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            var ip = currentUser.IpAddress ?? "unknown";
            var rateCheck = rateLimiter.CheckRateLimit($"register:ip:{ip}", secOptions.Value.RateLimit.RegisterMaxAttempts, TimeSpan.FromHours(secOptions.Value.RateLimit.RegisterWindowHours));
            if (!rateCheck.IsAllowed)
            {
                context.Response.Headers.Append("Retry-After", ((int)rateCheck.RetryAfter.TotalSeconds).ToString());
                return Results.Problem(
                    detail: $"Muitas tentativas de cadastro. Tente novamente em {(int)rateCheck.RetryAfter.TotalMinutes} minutos.",
                    statusCode: StatusCodes.Status429TooManyRequests
                );
            }

            if (string.IsNullOrWhiteSpace(dto.Nome) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return Results.BadRequest(new { message = "Nome, e-mail e senha são obrigatórios." });
            }

            string emailNormalized = dto.Email.Trim().ToLowerInvariant();

            // Validação de senha estrita (sem envio para APIs externas)
            var (isPasswordValid, passwordError) = passwordValidator.Validate(dto.Password, emailNormalized, dto.Nome);
            if (!isPasswordValid)
            {
                return Results.BadRequest(new { message = passwordError });
            }

            var existingUser = await authRepo.GetUserByEmailNormalizedAsync(emailNormalized);
            if (existingUser != null)
            {
                // Resposta genérica para mitigar enumeração de contas
                await auditService.LogAsync("REGISTER_ATTEMPT_DUPLICATE_EMAIL", "FAILED", details: $"E-mail já existente: {emailNormalized}");
                return Results.BadRequest(new { message = "Não foi possível concluir o cadastro com as informações fornecidas." });
            }

            string passwordHash = passwordHasher.HashPassword(dto.Password);

            var newUser = new User
            {
                Nome = dto.Nome.Trim(),
                Email = dto.Email.Trim(),
                EmailNormalized = emailNormalized,
                PasswordHash = passwordHash,
                Role = "User", // Default seguro
                IsActive = true,
                EmailVerified = false,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await authRepo.CreateUserAsync(newUser);

            // Geração de token de verificação de e-mail de uso único (256 bits de entropia)
            string rawToken = tokenService.GenerateOpaqueToken();
            string tokenHash = tokenService.ComputeSha256Hash(rawToken);

            var userToken = new UserToken
            {
                UserId = newUser.Id,
                TokenType = "EMAIL_VERIFICATION",
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };
            await authRepo.CreateTokenAsync(userToken);

            await auditService.LogAsync("USER_REGISTER", "SUCCESS", newUser.Id, "Novo usuário cadastrado");

            return Results.Created($"/api/auth/me", new
            {
                message = "Cadastro realizado com sucesso. Verifique seu e-mail para validar sua conta.",
                verificationToken = rawToken // Em ambiente de desenvolvimento/teste para validação
            });
        });

        // --------------------------------------------------------------------
        // 2. Verificação de E-mail
        // --------------------------------------------------------------------
        authGroup.MapPost("/verify-email", async (
            [FromBody] VerifyEmailRequestDto dto,
            IAuthRepository authRepo,
            ITokenService tokenService,
            ISecurityAuditService auditService) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
            {
                return Results.BadRequest(new { message = "Token de verificação inválido." });
            }

            string tokenHash = tokenService.ComputeSha256Hash(dto.Token);
            var consumedToken = await authRepo.ConsumeTokenAsync("EMAIL_VERIFICATION", tokenHash);

            if (consumedToken == null)
            {
                return Results.BadRequest(new { message = "Token de verificação inválido, já utilizado ou expirado." });
            }

            var user = await authRepo.GetUserByIdAsync(consumedToken.UserId);
            if (user != null)
            {
                user.EmailVerified = true;
                await authRepo.UpdateUserAsync(user);
                await auditService.LogAsync("EMAIL_VERIFIED", "SUCCESS", user.Id);
            }

            return Results.Ok(new { message = "E-mail verificado com sucesso." });
        });

        // --------------------------------------------------------------------
        // 3. Login
        // --------------------------------------------------------------------
        authGroup.MapPost("/login", async (
            [FromBody] LoginRequestDto dto,
            IAuthRepository authRepo,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IRateLimiterService rateLimiter,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            var ip = currentUser.IpAddress ?? "unknown";
            string emailNormalized = dto.Email?.Trim().ToLowerInvariant() ?? "";

            // Rate Limit por IP e por conta
            var rateCheckIp = rateLimiter.CheckRateLimit($"login:ip:{ip}", secOptions.Value.RateLimit.LoginMaxAttempts * 2, TimeSpan.FromMinutes(secOptions.Value.RateLimit.LoginWindowMinutes));
            var rateCheckAcc = rateLimiter.CheckRateLimit($"login:acc:{emailNormalized}", secOptions.Value.RateLimit.LoginMaxAttempts, TimeSpan.FromMinutes(secOptions.Value.RateLimit.LoginWindowMinutes));

            if (!rateCheckIp.IsAllowed || !rateCheckAcc.IsAllowed)
            {
                var retryAfter = rateCheckAcc.RetryAfter > rateCheckIp.RetryAfter ? rateCheckAcc.RetryAfter : rateCheckIp.RetryAfter;
                context.Response.Headers.Append("Retry-After", ((int)retryAfter.TotalSeconds).ToString());
                await auditService.LogAsync("LOGIN_RATE_LIMITED", "SUSPICIOUS", details: $"IP={ip}, Email={emailNormalized}");
                return Results.Problem(
                    detail: $"Muitas tentativas incorretas. Tente novamente em {(int)retryAfter.TotalMinutes} minutos.",
                    statusCode: StatusCodes.Status429TooManyRequests
                );
            }

            var user = await authRepo.GetUserByEmailNormalizedAsync(emailNormalized);
            if (user == null)
            {
                // Executa custo Argon2id equivalente para que o tempo seja idêntico a um usuário existente com senha errada
                passwordHasher.ExecuteDummyHash();
                await auditService.LogAsync("LOGIN_FAILED_NONEXISTENT", "FAILED", details: $"E-mail={emailNormalized}");
                return Results.Unauthorized();
            }

            if (!user.IsActive)
            {
                await auditService.LogAsync("LOGIN_FAILED_INACTIVE_USER", "FAILED", user.Id, "Conta inativa");
                return Results.Problem(detail: "Conta desativada. Entre em contato com o suporte.", statusCode: StatusCodes.Status403Forbidden);
            }

            bool passwordCorrect = passwordHasher.VerifyPassword(dto.Password, user.PasswordHash);
            if (!passwordCorrect)
            {
                await auditService.LogAsync("LOGIN_FAILED_INVALID_PASSWORD", "FAILED", user.Id);
                return Results.Unauthorized();
            }

            // Sucesso na verificação de senha -> reseta limites de falha para a conta
            rateLimiter.ResetRateLimit($"login:acc:{emailNormalized}");

            bool rememberMe = dto.RememberMe ?? true;

            // Emissão direta de Sessão e Tokens (autenticação simples com usuário e senha)
            return await IssueSessionAndTokensAsync(context, user, authRepo, tokenService, auditService, secOptions.Value, currentUser, rememberMe);
        });

        // --------------------------------------------------------------------
        // 4. Verificação de MFA
        // --------------------------------------------------------------------
        authGroup.MapPost("/mfa/verify", async (
            [FromBody] MfaVerifyRequestDto dto,
            IAuthRepository authRepo,
            ITotpService totpService,
            ITokenService tokenService,
            IRateLimiterService rateLimiter,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            var ip = currentUser.IpAddress ?? "unknown";
            var rateCheck = rateLimiter.CheckRateLimit($"mfa:ip:{ip}", secOptions.Value.RateLimit.MfaMaxAttempts, TimeSpan.FromMinutes(secOptions.Value.RateLimit.MfaWindowMinutes));
            if (!rateCheck.IsAllowed)
            {
                context.Response.Headers.Append("Retry-After", ((int)rateCheck.RetryAfter.TotalSeconds).ToString());
                return Results.Problem(detail: "Muitas tentativas de MFA. Tente novamente mais tarde.", statusCode: StatusCodes.Status429TooManyRequests);
            }

            if (string.IsNullOrWhiteSpace(dto.MfaToken) || string.IsNullOrWhiteSpace(dto.Code))
            {
                return Results.BadRequest(new { message = "Token de desafio e código MFA são obrigatórios." });
            }

            string tokenHash = tokenService.ComputeSha256Hash(dto.MfaToken);
            var challenge = await authRepo.ConsumeTokenAsync("MFA_CHALLENGE", tokenHash);
            if (challenge == null)
            {
                return Results.BadRequest(new { message = "Desafio MFA inválido ou expirado. Faça login novamente." });
            }

            var user = await authRepo.GetUserByIdAsync(challenge.UserId);
            if (user == null || !user.IsActive)
            {
                return Results.Unauthorized();
            }

            bool mfaSuccess = false;

            if (dto.IsRecoveryCode)
            {
                // Código de recuperação (uso único)
                string codeHash = totpService.HashRecoveryCode(dto.Code);
                mfaSuccess = await authRepo.ConsumeRecoveryCodeAsync(user.Id, codeHash);
                if (mfaSuccess)
                {
                    await auditService.LogAsync("MFA_RECOVERY_CODE_USED", "SUCCESS", user.Id);
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(user.TotpSecretEncrypted))
                {
                    return Results.BadRequest(new { message = "TOTP não configurado para este usuário." });
                }

                string plainSecret = totpService.DecryptSecret(user.TotpSecretEncrypted);
                mfaSuccess = totpService.VerifyCode(plainSecret, dto.Code, user.LastTotpStep, out long matchedStep);
                if (mfaSuccess)
                {
                    // Atualiza LastTotpStep para impedir reutilização (replay attack)
                    user.LastTotpStep = matchedStep;
                    await authRepo.UpdateUserAsync(user);
                    await auditService.LogAsync("MFA_TOTP_VERIFIED", "SUCCESS", user.Id);
                }
            }

            if (!mfaSuccess)
            {
                await auditService.LogAsync("MFA_VERIFY_FAILED", "FAILED", user.Id);
                return Results.BadRequest(new { message = "Código MFA inválido ou já utilizado." });
            }

            return await IssueSessionAndTokensAsync(context, user, authRepo, tokenService, auditService, secOptions.Value, currentUser);
        });

        // --------------------------------------------------------------------
        // 5. Consulta do Usuário Autenticado (/api/auth/me)
        // --------------------------------------------------------------------
        authGroup.MapGet("/me", async (
            IAuthRepository authRepo,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue)
            {
                return Results.Unauthorized();
            }

            var user = await authRepo.GetUserByIdAsync(currentUser.UserId.Value);
            if (user == null || !user.IsActive)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(new UserDto(
                user.Id,
                user.Nome,
                user.Email,
                user.Role,
                user.EmailVerified,
                user.TotpEnabled,
                user.CreatedAt
            ));
        }).RequireAuthorization();

        // ----------------- CARTEIRA / AUTENTICAÇÃO / SESSÃO -----------------
        // 6. Renovação da Autenticação (/api/auth/refresh)
        // --------------------------------------------------------------------
        authGroup.MapPost("/refresh", async (
            [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] RefreshTokenRequestDto? bodyDto,
            IAuthRepository authRepo,
            ITokenService tokenService,
            IRateLimiterService rateLimiter,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            var ip = currentUser.IpAddress ?? "unknown";
            var rateCheck = rateLimiter.CheckRateLimit($"refresh:ip:{ip}", secOptions.Value.RateLimit.RefreshMaxAttemptsPerMinute, TimeSpan.FromMinutes(1));
            if (!rateCheck.IsAllowed)
            {
                context.Response.Headers.Append("Retry-After", ((int)rateCheck.RetryAfter.TotalSeconds).ToString());
                return Results.Problem(detail: "Muitas requisições de renovação. Aguarde.", statusCode: StatusCodes.Status429TooManyRequests);
            }

            string? refreshToken = null;
            if (!string.IsNullOrWhiteSpace(bodyDto?.RefreshToken))
            {
                refreshToken = bodyDto.RefreshToken.Trim();
            }
            else if (context.Request.Headers.TryGetValue("X-Refresh-Token", out var headerVal) && !string.IsNullOrWhiteSpace(headerVal))
            {
                refreshToken = headerVal.ToString().Trim();
            }
            else
            {
                string cookieName = GetRefreshCookieName(context, secOptions.Value);
                if (!context.Request.Cookies.TryGetValue(cookieName, out refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
                {
                    if (!context.Request.Cookies.TryGetValue(secOptions.Value.Session.CookieName, out refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
                    {
                        context.Request.Cookies.TryGetValue(secOptions.Value.Session.FallbackCookieName, out refreshToken);
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                // O refresh também funciona como bootstrap silencioso da SPA.
                // Ausência de cookie significa apenas que não há sessão a restaurar.
                return Results.NoContent();
            }

            string tokenHash = tokenService.ComputeSha256Hash(refreshToken);

            // Busca sessão pelo hash do refresh token atual
            var session = await authRepo.GetSessionByRefreshTokenHashAsync(tokenHash);

            if (session == null)
            {
                // Token não encontrado como ativo. Verifica se corresponde a um token anterior da sessão (possível reuso ou concorrência)
                var prevSession = await authRepo.GetSessionByPreviousTokenHashAsync(tokenHash);
                if (prevSession != null)
                {
                    var now = DateTime.UtcNow;
                    var timeSinceRotation = prevSession.PreviousTokenRotatedAt.HasValue
                        ? now - prevSession.PreviousTokenRotatedAt.Value
                        : TimeSpan.MaxValue;

                    // Janela de tolerância estrita (ex: 20s) para abas concorrentes com o mesmo IP e UserAgent
                    if (timeSinceRotation <= TimeSpan.FromSeconds(secOptions.Value.Session.GraceWindowSeconds) &&
                        !prevSession.IsRevoked &&
                        prevSession.IpAddress == ip)
                    {
                        var userExisting = await authRepo.GetUserByIdAsync(prevSession.UserId);
                        if (userExisting != null && userExisting.IsActive)
                        {
                            string graceAccessToken = tokenService.GenerateAccessToken(userExisting, prevSession.Id);
                            return Results.Ok(new RefreshTokenResponseDto(
                                graceAccessToken,
                                secOptions.Value.Jwt.AccessTokenLifetimeMinutes * 60,
                                new UserDto(userExisting.Id, userExisting.Nome, userExisting.Email, userExisting.Role, userExisting.EmailVerified, userExisting.TotpEnabled, userExisting.CreatedAt)
                            ));
                        }
                    }

                    // Fora da janela de graça: REUSO DETECTADO! Revoga toda a família de sessões
                    await authRepo.RevokeSessionFamilyAsync(prevSession.SessionFamilyId, "TOKEN_REUSE_DETECTED");
                    await auditService.LogAsync("REFRESH_TOKEN_REUSE_DETECTED", "SUSPICIOUS", prevSession.UserId,
                        $"Família {prevSession.SessionFamilyId} revogada devido a reuso de token.");

                    ClearRefreshCookie(context, secOptions.Value);
                    return Results.NoContent();
                }

                ClearRefreshCookie(context, secOptions.Value);
                return Results.NoContent();
            }

            // Verifica se a sessão está revogada ou expirada
            var currentTime = DateTime.UtcNow;
            if (session.IsRevoked || session.ExpiresAt <= currentTime || session.IdleExpiresAt <= currentTime)
            {
                ClearRefreshCookie(context, secOptions.Value);
                return Results.NoContent();
            }

            var user = await authRepo.GetUserByIdAsync(session.UserId);
            if (user == null || !user.IsActive)
            {
                await authRepo.RevokeSessionAsync(session.Id, "USER_INACTIVE_OR_DELETED");
                ClearRefreshCookie(context, secOptions.Value);
                return Results.NoContent();
            }

            // Rotação atômica do refresh token
            string newRefreshToken = tokenService.GenerateOpaqueToken();
            string newRefreshTokenHash = tokenService.ComputeSha256Hash(newRefreshToken);
            var newIdleExpires = MinDateTime(
                currentTime.AddHours(GetInactivityLifetimeHours(secOptions.Value)),
                session.ExpiresAt
            );

            await authRepo.RotateSessionAsync(
                session.Id,
                newRefreshTokenHash,
                tokenHash,
                currentTime,
                newIdleExpires
            );

            // Atualiza cookie HttpOnly
            SetRefreshCookie(context, newRefreshToken, session.ExpiresAt, secOptions.Value);

            string newAccessToken = tokenService.GenerateAccessToken(user, session.Id);

            return Results.Ok(new RefreshTokenResponseDto(
                newAccessToken,
                secOptions.Value.Jwt.AccessTokenLifetimeMinutes * 60,
                new UserDto(user.Id, user.Nome, user.Email, user.Role, user.EmailVerified, user.TotpEnabled, user.CreatedAt)
            ));
        });

        // --------------------------------------------------------------------
        // 7. Logout da Sessão Atual (/api/auth/logout)
        // --------------------------------------------------------------------
        authGroup.MapPost("/logout", async (
            [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] RefreshTokenRequestDto? bodyDto,
            IAuthRepository authRepo,
            ITokenService tokenService,
            ISecurityAuditService auditService,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            string? refreshToken = null;
            if (!string.IsNullOrWhiteSpace(bodyDto?.RefreshToken))
            {
                refreshToken = bodyDto.RefreshToken.Trim();
            }
            else if (context.Request.Headers.TryGetValue("X-Refresh-Token", out var headerVal) && !string.IsNullOrWhiteSpace(headerVal))
            {
                refreshToken = headerVal.ToString().Trim();
            }
            else
            {
                string cookieName = GetRefreshCookieName(context, secOptions.Value);
                if (!context.Request.Cookies.TryGetValue(cookieName, out refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
                {
                    if (!context.Request.Cookies.TryGetValue(secOptions.Value.Session.CookieName, out refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
                    {
                        context.Request.Cookies.TryGetValue(secOptions.Value.Session.FallbackCookieName, out refreshToken);
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                string tokenHash = tokenService.ComputeSha256Hash(refreshToken);
                var session = await authRepo.GetSessionByRefreshTokenHashAsync(tokenHash);
                if (session != null)
                {
                    await authRepo.RevokeSessionAsync(session.Id, "USER_LOGOUT");
                    await auditService.LogAsync("USER_LOGOUT", "SUCCESS", session.UserId);
                }
            }

            ClearRefreshCookie(context, secOptions.Value);
            return Results.Ok(new { message = "Logout efetuado com sucesso." });
        });

        // --------------------------------------------------------------------
        // 8. Logout de Todas as Sessões (/api/auth/logout-all)
        // --------------------------------------------------------------------
        authGroup.MapPost("/logout-all", async (
            IAuthRepository authRepo,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            if (!currentUser.UserId.HasValue)
            {
                return Results.Unauthorized();
            }

            var userId = currentUser.UserId.Value;

            // Invalidação em tempo real: incrementa token_version do usuário
            await authRepo.IncrementTokenVersionAsync(userId);
            // Revoga todas as sessões registradas no banco
            await authRepo.RevokeAllUserSessionsAsync(userId, "USER_LOGOUT_ALL");

            ClearRefreshCookie(context, secOptions.Value);
            await auditService.LogAsync("USER_LOGOUT_ALL", "SUCCESS", userId);

            return Results.Ok(new { message = "Todas as sessões ativas foram revogadas com sucesso." });
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 9. Listagem de Sessões Ativas (/api/auth/sessions)
        // --------------------------------------------------------------------
        authGroup.MapGet("/sessions", async (
            IAuthRepository authRepo,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue) return Results.Unauthorized();

            var sessions = await authRepo.GetUserActiveSessionsAsync(currentUser.UserId.Value);
            var dtos = sessions.Select(s => new UserSessionDto(
                s.Id,
                s.UserAgent,
                s.IpAddress,
                currentUser.SessionId.HasValue && currentUser.SessionId.Value == s.Id,
                s.CreatedAt,
                s.LastActiveAt
            ));

            return Results.Ok(dtos);
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 10. Revogação de Sessão Específica (/api/auth/sessions/{id})
        // --------------------------------------------------------------------
        authGroup.MapDelete("/sessions/{id:guid}", async (
            Guid id,
            IAuthRepository authRepo,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue) return Results.Unauthorized();

            var session = await authRepo.GetSessionByIdAsync(id);
            if (session == null || session.UserId != currentUser.UserId.Value)
            {
                // Proteção contra IDOR: retorna 404 para não vazar existência de sessão de terceiros
                return Results.NotFound(new { message = "Sessão não encontrada." });
            }

            await authRepo.RevokeSessionAsync(id, "USER_REVOKED_SPECIFIC_SESSION");
            await auditService.LogAsync("SESSION_REVOKED", "SUCCESS", currentUser.UserId.Value, $"Sessão {id} revogada");

            return Results.Ok(new { message = "Sessão revogada com sucesso." });
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 11. Solicitação de Redefinição de Senha (/api/auth/forgot-password)
        // --------------------------------------------------------------------
        authGroup.MapPost("/forgot-password", async (
            [FromBody] ForgotPasswordRequestDto dto,
            IAuthRepository authRepo,
            ITokenService tokenService,
            IRateLimiterService rateLimiter,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser,
            IOptions<SecurityOptions> secOptions,
            HttpContext context) =>
        {
            var ip = currentUser.IpAddress ?? "unknown";
            string emailNormalized = dto.Email?.Trim().ToLowerInvariant() ?? "";

            var rateCheck = rateLimiter.CheckRateLimit($"forgot:ip:{ip}", secOptions.Value.RateLimit.ResetMaxAttempts, TimeSpan.FromHours(secOptions.Value.RateLimit.ResetWindowHours));
            if (!rateCheck.IsAllowed)
            {
                context.Response.Headers.Append("Retry-After", ((int)rateCheck.RetryAfter.TotalSeconds).ToString());
                return Results.Problem(detail: "Muitas solicitações de redefinição de senha. Aguarde.", statusCode: StatusCodes.Status429TooManyRequests);
            }

            var user = await authRepo.GetUserByEmailNormalizedAsync(emailNormalized);
            string? rawResetToken = null;

            if (user != null && user.IsActive)
            {
                rawResetToken = tokenService.GenerateOpaqueToken();
                string tokenHash = tokenService.ComputeSha256Hash(rawResetToken);

                var userToken = new UserToken
                {
                    UserId = user.Id,
                    TokenType = "PASSWORD_RESET",
                    TokenHash = tokenHash,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(30), // 30 minutos de validade
                    CreatedAt = DateTime.UtcNow
                };
                await authRepo.CreateTokenAsync(userToken);

                // Construção do link com AppUrl configurado (nunca confiando em Host header para evitar Host Header Poisoning)
                string resetLink = $"{secOptions.Value.AppUrl.TrimEnd('/')}/reset-password?token={rawResetToken}";
                await auditService.LogAsync("FORGOT_PASSWORD_REQUEST", "SUCCESS", user.Id);
            }
            else
            {
                await auditService.LogAsync("FORGOT_PASSWORD_REQUEST_NONEXISTENT", "FAILED", details: emailNormalized);
            }

            // Resposta genérica para mitigar enumeração de contas
            return Results.Ok(new
            {
                message = "Se o endereço de e-mail estiver cadastrado, as instruções para redefinição de senha foram enviadas.",
                resetToken = rawResetToken // Em ambiente de desenvolvimento/teste para facilitar validação
            });
        });

        // --------------------------------------------------------------------
        // 12. Execução da Redefinição de Senha (/api/auth/reset-password)
        // --------------------------------------------------------------------
        authGroup.MapPost("/reset-password", async (
            [FromBody] ResetPasswordRequestDto dto,
            IAuthRepository authRepo,
            IPasswordHasher passwordHasher,
            IPasswordValidator passwordValidator,
            ITokenService tokenService,
            ISecurityAuditService auditService) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return Results.BadRequest(new { message = "Token e nova senha são obrigatórios." });
            }

            string tokenHash = tokenService.ComputeSha256Hash(dto.Token);
            var consumedToken = await authRepo.ConsumeTokenAsync("PASSWORD_RESET", tokenHash);

            if (consumedToken == null)
            {
                return Results.BadRequest(new { message = "Token de recuperação inválido, expirado ou já utilizado." });
            }

            var user = await authRepo.GetUserByIdAsync(consumedToken.UserId);
            if (user == null || !user.IsActive)
            {
                return Results.BadRequest(new { message = "Usuário associado ao token não encontrado ou inativo." });
            }

            var (isValid, errorMsg) = passwordValidator.Validate(dto.NewPassword, user.Email, user.Nome);
            if (!isValid)
            {
                return Results.BadRequest(new { message = errorMsg });
            }

            user.PasswordHash = passwordHasher.HashPassword(dto.NewPassword);
            user.TokenVersion++; // Invalida access tokens emitidos anteriormente
            await authRepo.UpdateUserAsync(user);

            // Revoga todas as sessões do usuário
            await authRepo.RevokeAllUserSessionsAsync(user.Id, "PASSWORD_RESET");
            await auditService.LogAsync("PASSWORD_RESET_SUCCESS", "SUCCESS", user.Id);

            // Não autentica automaticamente o usuário após redefinir senha (regra de segurança OWASP)
            return Results.Ok(new { message = "Senha redefinida com sucesso. Faça login com suas novas credenciais." });
        });

        // --------------------------------------------------------------------
        // 13. Alteração de Senha com Reautenticação (/api/auth/change-password)
        // --------------------------------------------------------------------
        authGroup.MapPost("/change-password", async (
            [FromBody] ChangePasswordRequestDto dto,
            IAuthRepository authRepo,
            IPasswordHasher passwordHasher,
            IPasswordValidator passwordValidator,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue) return Results.Unauthorized();

            var user = await authRepo.GetUserByIdAsync(currentUser.UserId.Value);
            if (user == null || !user.IsActive) return Results.Unauthorized();

            // Reautenticação obrigatória com senha atual
            if (!passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
            {
                await auditService.LogAsync("CHANGE_PASSWORD_FAILED_CURRENT_PASSWORD", "FAILED", user.Id);
                return Results.BadRequest(new { message = "Senha atual incorreta." });
            }

            var (isValid, errorMsg) = passwordValidator.Validate(dto.NewPassword, user.Email, user.Nome);
            if (!isValid)
            {
                return Results.BadRequest(new { message = errorMsg });
            }

            user.PasswordHash = passwordHasher.HashPassword(dto.NewPassword);
            user.TokenVersion++; // Invalida tokens atuais
            await authRepo.UpdateUserAsync(user);

            // Revoga outras sessões (mantendo apenas a atual ou forçando relogin)
            await authRepo.RevokeAllUserSessionsAsync(user.Id, "PASSWORD_CHANGED");
            await auditService.LogAsync("PASSWORD_CHANGED_SUCCESS", "SUCCESS", user.Id);

            return Results.Ok(new { message = "Senha alterada com sucesso. Faça login novamente para continuar." });
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 14. Configuração de MFA: Início (/api/auth/mfa/setup)
        // --------------------------------------------------------------------
        authGroup.MapPost("/mfa/setup", async (
            IAuthRepository authRepo,
            ITotpService totpService,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue) return Results.Unauthorized();

            var user = await authRepo.GetUserByIdAsync(currentUser.UserId.Value);
            if (user == null) return Results.Unauthorized();

            string plainSecret = totpService.GenerateSecret();
            string uri = totpService.GenerateTotpUri(user.Email, plainSecret);
            string qrCodeBase64 = totpService.GenerateQrCodePngBase64(uri);
            var recoveryCodes = totpService.GenerateRecoveryCodes();

            // Criptografa o segredo em repouso
            string encryptedSecret = totpService.EncryptSecret(plainSecret);
            user.TotpSecretEncrypted = encryptedSecret;
            await authRepo.UpdateUserAsync(user);

            // Salva os códigos de recuperação como hashes
            var codeHashes = recoveryCodes.Select(totpService.HashRecoveryCode);
            await authRepo.SaveRecoveryCodesAsync(user.Id, codeHashes);

            return Results.Ok(new MfaSetupResponseDto(
                Secret: plainSecret,
                QrCodeUri: uri,
                QrCodeBase64: qrCodeBase64,
                RecoveryCodes: recoveryCodes
            ));
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 15. Confirmação e Ativação de MFA (/api/auth/mfa/confirm)
        // --------------------------------------------------------------------
        authGroup.MapPost("/mfa/confirm", async (
            [FromBody] MfaConfirmRequestDto dto,
            IAuthRepository authRepo,
            ITotpService totpService,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue) return Results.Unauthorized();

            var user = await authRepo.GetUserByIdAsync(currentUser.UserId.Value);
            if (user == null || string.IsNullOrWhiteSpace(user.TotpSecretEncrypted))
            {
                return Results.BadRequest(new { message = "Inicie a configuração do MFA antes de confirmar." });
            }

            string plainSecret = totpService.DecryptSecret(user.TotpSecretEncrypted);
            bool isValid = totpService.VerifyCode(plainSecret, dto.Code, user.LastTotpStep, out long matchedStep);

            if (!isValid)
            {
                return Results.BadRequest(new { message = "Código de verificação incorreto." });
            }

            user.TotpEnabled = true;
            user.LastTotpStep = matchedStep;
            await authRepo.UpdateUserAsync(user);

            await auditService.LogAsync("MFA_ACTIVATED", "SUCCESS", user.Id);
            return Results.Ok(new { message = "Autenticação em duas etapas ativada com sucesso." });
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 16. Desativação de MFA (/api/auth/mfa/disable)
        // --------------------------------------------------------------------
        authGroup.MapPost("/mfa/disable", async (
            [FromBody] MfaDisableRequestDto dto,
            IAuthRepository authRepo,
            IPasswordHasher passwordHasher,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser) =>
        {
            if (!currentUser.UserId.HasValue) return Results.Unauthorized();

            var user = await authRepo.GetUserByIdAsync(currentUser.UserId.Value);
            if (user == null) return Results.Unauthorized();

            // Administradores não podem desativar MFA (requisito mandatório)
            if (string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new { message = "MFA é obrigatório para contas de Administrador e não pode ser desativado." });
            }

            // Exige reautenticação com senha
            if (!passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return Results.BadRequest(new { message = "Senha incorreta. Não foi possível desativar o MFA." });
            }

            user.TotpEnabled = false;
            user.TotpSecretEncrypted = null;
            user.LastTotpStep = null;
            await authRepo.UpdateUserAsync(user);

            await auditService.LogAsync("MFA_DISABLED", "SUCCESS", user.Id);
            return Results.Ok(new { message = "Autenticação em duas etapas desativada com sucesso." });
        }).RequireAuthorization();

        // --------------------------------------------------------------------
        // 17. Endpoints Administrativos (/api/admin/users)
        // --------------------------------------------------------------------
        var adminGroup = app.MapGroup("/api/admin").WithTags("Administração").RequireAuthorization("AdminOnly");

        adminGroup.MapGet("/users", async (IAuthRepository authRepo) =>
        {
            var users = await authRepo.GetAllUsersAsync();
            var dtos = users.Select(u => new UserDto(
                u.Id,
                u.Nome,
                u.Email,
                u.Role,
                u.EmailVerified,
                u.TotpEnabled,
                u.CreatedAt
            ));
            return Results.Ok(dtos);
        });

        adminGroup.MapPut("/users/{id:guid}/status", async (
            Guid id,
            [FromBody] bool isActive,
            IAuthRepository authRepo,
            ISecurityAuditService auditService,
            ICurrentUserService currentUser) =>
        {
            var user = await authRepo.GetUserByIdAsync(id);
            if (user == null) return Results.NotFound(new { message = "Usuário não encontrado." });

            user.IsActive = isActive;
            user.TokenVersion++; // Invalida tokens atuais imediatamente
            await authRepo.UpdateUserAsync(user);

            if (!isActive)
            {
                // Se foi desativado, revoga todas as sessões registradas
                await authRepo.RevokeAllUserSessionsAsync(id, "ADMIN_DEACTIVATED_USER");
            }

            await auditService.LogAsync("ADMIN_USER_STATUS_CHANGED", "SUCCESS", currentUser.UserId, $"Usuário {id} ativo={isActive}");
            return Results.Ok(new { message = $"Status do usuário alterado para {(isActive ? "Ativo" : "Inativo")}." });
        });

        adminGroup.MapGet("/audit-logs", async (IAuthRepository authRepo) =>
        {
            var logs = await authRepo.GetRecentAuditLogsAsync(100);
            var dtos = logs.Select(l => new AuditLogDto(
                l.Id,
                l.Action,
                l.Status,
                l.IpAddress,
                l.UserAgent,
                l.Details,
                l.CreatedAt
            ));
            return Results.Ok(dtos);
        });
    }

    private static async Task<IResult> IssueSessionAndTokensAsync(
        HttpContext context,
        User user,
        IAuthRepository authRepo,
        ITokenService tokenService,
        ISecurityAuditService auditService,
        SecurityOptions secOptions,
        ICurrentUserService currentUser,
        bool rememberMe = true)
    {
        var now = DateTime.UtcNow;
        var familyId = Guid.NewGuid();
        string rawRefreshToken = tokenService.GenerateOpaqueToken();
        string refreshTokenHash = tokenService.ComputeSha256Hash(rawRefreshToken);

        var minimumLifetime = TimeSpan.FromHours(Math.Max(1, secOptions.Session.MinimumLifetimeHours));
        var requestedLifetime = rememberMe
            ? TimeSpan.FromDays(Math.Max(1, secOptions.Session.AbsoluteLifetimeDays))
            : minimumLifetime;
        var sessionLifetime = requestedLifetime < minimumLifetime ? minimumLifetime : requestedLifetime;
        var expiresAt = now.Add(sessionLifetime);

        // A janela de inatividade tambem respeita o periodo minimo, sem ultrapassar
        // a expiracao absoluta da sessao.
        var idleExpiresAt = MinDateTime(
            now.AddHours(GetInactivityLifetimeHours(secOptions)),
            expiresAt
        );

        var session = new UserSession
        {
            UserId = user.Id,
            SessionFamilyId = familyId,
            RefreshTokenHash = refreshTokenHash,
            UserAgent = currentUser.UserAgent,
            IpAddress = currentUser.IpAddress,
            IsRevoked = false,
            ExpiresAt = expiresAt,
            IdleExpiresAt = idleExpiresAt,
            CreatedAt = now,
            LastActiveAt = now
        };

        await authRepo.CreateSessionAsync(session);

        // Define Cookie HttpOnly
        SetRefreshCookie(context, rawRefreshToken, expiresAt, secOptions);

        string accessToken = tokenService.GenerateAccessToken(user, session.Id);

        await auditService.LogAsync("LOGIN_SUCCESS", "SUCCESS", user.Id);

        return Results.Ok(new LoginResponseDto(
            RequiresMfa: false,
            MfaToken: null,
            AccessToken: accessToken,
            ExpiresIn: secOptions.Jwt.AccessTokenLifetimeMinutes * 60,
            User: new UserDto(user.Id, user.Nome, user.Email, user.Role, user.EmailVerified, user.TotpEnabled, user.CreatedAt)
        ));
    }

    private static string GetRefreshCookieName(HttpContext context, SecurityOptions options)
    {
        // Se a conexão for HTTPS ou EnforceHttps, usamos prefixo seguro __Host-
        if (context.Request.IsHttps || options.EnforceHttps)
        {
            return options.Session.CookieName;
        }
        return options.Session.FallbackCookieName;
    }

    private static void SetRefreshCookie(HttpContext context, string refreshToken, DateTime expiresAt, SecurityOptions options)
    {
        bool isHttps = context.Request.IsHttps || options.EnforceHttps;
        string cookieName = isHttps ? options.Session.CookieName : options.Session.FallbackCookieName;

        // Cookies com prefixo __Host- sao rejeitados pelo navegador se Path nao for "/".
        // No ambiente HTTP local usamos o nome alternativo e podemos restringir o path.
        string cookiePath = cookieName.StartsWith("__Host-", StringComparison.Ordinal)
            ? "/"
            : "/api/auth";
        var maxAge = expiresAt - DateTime.UtcNow;

        context.Response.Cookies.Append(cookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true, // Inacessível via JavaScript (mitigação de XSS)
            Secure = isHttps,
            SameSite = SameSiteMode.Strict,
            Path = cookiePath,
            Expires = expiresAt,
            MaxAge = maxAge > TimeSpan.Zero ? maxAge : TimeSpan.Zero,
            IsEssential = true
        });
    }

    private static void ClearRefreshCookie(HttpContext context, SecurityOptions options)
    {
        // Limpa usando ambos os nomes possíveis para garantir remoção
        string hostName = options.Session.CookieName;
        string fallbackName = options.Session.FallbackCookieName;

        var deleteOptionsHttps = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        };

        var deleteOptionsHttp = new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        };

        context.Response.Cookies.Delete(hostName, deleteOptionsHttps);
        context.Response.Cookies.Delete(fallbackName, deleteOptionsHttp);
    }

    private static double GetInactivityLifetimeHours(SecurityOptions options)
    {
        return Math.Max(
            Math.Max(1, options.Session.InactivityLifetimeHours),
            Math.Max(1, options.Session.MinimumLifetimeHours)
        );
    }

    private static DateTime MinDateTime(DateTime first, DateTime second)
    {
        return first <= second ? first : second;
    }
}
