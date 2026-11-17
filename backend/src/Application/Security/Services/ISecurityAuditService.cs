using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Application.Security.Services;

public interface ISecurityAuditService
{
    Task LogAsync(string action, string status, Guid? userId = null, string? details = null);
}
