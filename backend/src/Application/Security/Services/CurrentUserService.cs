using System.Security.Claims;

namespace InvestirGo.API.Application.Security.Services;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    Guid? SessionId { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private HttpContext? HttpContext => _httpContextAccessor.HttpContext;

    public Guid? UserId
    {
        get
        {
            var sub = HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? HttpContext?.User.FindFirst("sub")?.Value;
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? Email => HttpContext?.User.FindFirst(ClaimTypes.Email)?.Value
                            ?? HttpContext?.User.FindFirst("email")?.Value;

    public string? Role => HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value
                           ?? HttpContext?.User.FindFirst("role")?.Value;

    public bool IsAuthenticated => HttpContext?.User.Identity?.IsAuthenticated ?? false;

    public bool IsAdmin => string.Equals(Role, "Admin", StringComparison.OrdinalIgnoreCase);

    public Guid? SessionId
    {
        get
        {
            var sid = HttpContext?.User.FindFirst("sid")?.Value;
            return Guid.TryParse(sid, out var id) ? id : null;
        }
    }

    public string? IpAddress
    {
        get
        {
            // Trata cabeçalhos de proxy reverso com segurança (X-Forwarded-For) se presente
            if (HttpContext?.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded) == true)
            {
                var ip = forwarded.ToString().Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(ip)) return ip;
            }
            return HttpContext?.Connection.RemoteIpAddress?.ToString();
        }
    }

    public string? UserAgent => HttpContext?.Request.Headers.UserAgent.ToString();
}
