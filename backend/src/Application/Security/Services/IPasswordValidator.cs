namespace InvestirGo.API.Application.Security.Services;

public interface IPasswordValidator
{
    (bool IsValid, string? ErrorMessage) Validate(string password, string? userEmail = null, string? userName = null);
}
