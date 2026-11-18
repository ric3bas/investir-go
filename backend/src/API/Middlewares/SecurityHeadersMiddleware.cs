using InvestirGo.API.Application.Security.Options;
using Microsoft.Extensions.Options;

namespace InvestirGo.API.API.Middlewares;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SecurityOptions _securityOptions;

    public SecurityHeadersMiddleware(RequestDelegate next, IOptions<SecurityOptions> securityOptions)
    {
        _next = next;
        _securityOptions = securityOptions.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Swagger UI requer scripts e estilos embutidos para renderizar a interface
        if (context.Request.Path.StartsWithSegments("/swagger"))
        {
            await _next(context);
            return;
        }

        // 1. Prevenção de MIME Sniffing
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

        // 2. Prevenção de Clickjacking
        context.Response.Headers.Append("X-Frame-Options", "DENY");

        // 3. Política de Referrer estrita
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        // 4. Permissions-Policy (restringe APIs do navegador não utilizadas)
        context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

        // 5. Content Security Policy (CSP)
        // Permite scripts e estilos locais, imagens locais e data URIs (para QR code do TOTP), conexões para a API
        string csp = "default-src 'self'; " +
                     "script-src 'self'; " +
                     "style-src 'self' 'unsafe-inline'; " +
                     "img-src 'self' data: https:; " +
                     "font-src 'self'; " +
                     "connect-src 'self' https://investir.cloud https://api.investir.cloud http://localhost:5050 https://localhost:5050 http://localhost:5173 https://localhost:5173; " +
                     "frame-ancestors 'none'; " +
                     "object-src 'none'; " +
                     "base-uri 'self';";
        context.Response.Headers.Append("Content-Security-Policy", csp);

        // 6. HSTS em conexões HTTPS
        if (context.Request.IsHttps || _securityOptions.EnforceHttps)
        {
            context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        }

        // 7. Desabilita cache em respostas sensíveis de autenticação
        if (context.Request.Path.StartsWithSegments("/api/auth"))
        {
            context.Response.Headers.Append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            context.Response.Headers.Append("Pragma", "no-cache");
            context.Response.Headers.Append("Expires", "0");
        }

        await _next(context);
    }
}
