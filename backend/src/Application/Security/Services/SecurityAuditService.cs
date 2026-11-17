using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using Serilog;

namespace InvestirGo.API.Application.Security.Services;

public class SecurityAuditService : ISecurityAuditService
{
    private readonly IAuthRepository _authRepository;
    private readonly ICurrentUserService _currentUserService;

    public SecurityAuditService(IAuthRepository authRepository, ICurrentUserService currentUserService)
    {
        _authRepository = authRepository;
        _currentUserService = currentUserService;
    }

    public async Task LogAsync(string action, string status, Guid? userId = null, string? details = null)
    {
        var resolvedUserId = userId ?? _currentUserService.UserId;
        var ip = _currentUserService.IpAddress;
        var userAgent = _currentUserService.UserAgent;

        var auditLog = new AuditLog
        {
            UserId = resolvedUserId,
            Action = action,
            Status = status,
            IpAddress = ip,
            UserAgent = userAgent,
            Details = details,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await _authRepository.CreateAuditLogAsync(auditLog);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Falha ao gravar registro de auditoria no repositório.");
        }

        // Registro em log estruturado sem vazar credenciais ou segredos
        if (status == "SUSPICIOUS")
        {
            Log.Warning("[AUDIT-SECURITY-ALERT] Action={Action} Status={Status} UserId={UserId} IP={IP} Details={Details}",
                action, status, resolvedUserId, ip, details);
        }
        else if (status == "FAILED")
        {
            Log.Information("[AUDIT-SECURITY] Action={Action} Status={Status} UserId={UserId} IP={IP} Details={Details}",
                action, status, resolvedUserId, ip, details);
        }
        else
        {
            Log.Information("[AUDIT] Action={Action} Status={Status} UserId={UserId} IP={IP}",
                action, status, resolvedUserId, ip);
        }
    }
}
