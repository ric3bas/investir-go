using System.Security.Cryptography;
using System.Text;
using InvestirGo.API.Application.Security.Options;
using Microsoft.Extensions.Options;

namespace InvestirGo.API.API.Middlewares;

public class CsrfProtectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SecurityOptions _options;
    private static readonly HashSet<string> CookieProtectedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/refresh",
        "/api/auth/logout",
        "/api/auth/logout-all"
    };

    public CsrfProtectionMiddleware(RequestDelegate next, IOptions<SecurityOptions> options)
    {
        _next = next;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        // Se o método for de mutação (POST/DELETE/PUT) em rota autenticada por cookie
        if (HttpMethods.IsPost(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPut(method))
        {
            if (CookieProtectedPaths.Contains(path))
            {
                // 1. Validação estrita de Origin / Referer contra origens autorizadas
                if (context.Request.Headers.TryGetValue("Origin", out var originHeader))
                {
                    string origin = originHeader.ToString().TrimEnd('/');
                    bool isAllowedOrigin = _options.AllowedOrigins.Any(o => o.TrimEnd('/').Equals(origin, StringComparison.OrdinalIgnoreCase));
                    if (!isAllowedOrigin)
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "Origem não autorizada (CORS/CSRF Violation)." });
                        return;
                    }
                }
                else if (context.Request.Headers.TryGetValue("Referer", out var refererHeader))
                {
                    if (Uri.TryCreate(refererHeader.ToString(), UriKind.Absolute, out var refererUri))
                    {
                        string refererOrigin = $"{refererUri.Scheme}://{refererUri.Authority}";
                        bool isAllowedReferer = _options.AllowedOrigins.Any(o => o.TrimEnd('/').Equals(refererOrigin, StringComparison.OrdinalIgnoreCase));
                        if (!isAllowedReferer)
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            await context.Response.WriteAsJsonAsync(new { message = "Referer não autorizado (CSRF Violation)." });
                            return;
                        }
                    }
                }

                // 2. Double-Submit CSRF Token
                if (context.Request.Cookies.TryGetValue("XSRF-TOKEN", out var cookieToken) && !string.IsNullOrWhiteSpace(cookieToken))
                {
                    var headerToken = context.Request.Headers["X-CSRF-Token"].ToString();
                    if (string.IsNullOrWhiteSpace(headerToken))
                    {
                        headerToken = context.Request.Headers["X-XSRF-TOKEN"].ToString();
                    }

                    if (string.IsNullOrWhiteSpace(headerToken) ||
                        !CryptographicOperations.FixedTimeEquals(
                            Encoding.UTF8.GetBytes(cookieToken),
                            Encoding.UTF8.GetBytes(headerToken)))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "Token CSRF inválido ou ausente." });
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}
