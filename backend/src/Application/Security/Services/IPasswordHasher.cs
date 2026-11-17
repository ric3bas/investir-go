namespace InvestirGo.API.Application.Security.Services;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
    void ExecuteDummyHash();
}
