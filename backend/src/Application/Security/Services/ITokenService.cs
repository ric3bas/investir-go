using System.Security.Claims;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Application.Security.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user, Guid sessionId);
    ClaimsPrincipal? ValidateAccessToken(string token, bool validateLifetime = true);
    string GenerateOpaqueToken(int byteLength = 32); // 32 bytes = 256 bits de entropia
    string ComputeSha256Hash(string input);
    bool VerifySha256Hash(string input, string expectedHash);
}
