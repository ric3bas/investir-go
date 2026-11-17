using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using InvestirGo.API.Application.Security.Options;
using InvestirGo.API.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace InvestirGo.API.Application.Security.Services;

public class JwtTokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;
    private readonly SymmetricSecurityKey _signingKey;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public JwtTokenService(IOptions<SecurityOptions> options)
    {
        _jwtOptions = options.Value.Jwt;
        if (string.IsNullOrWhiteSpace(_jwtOptions.SecretKey) || Encoding.UTF8.GetByteCount(_jwtOptions.SecretKey) < 32)
        {
            throw new InvalidOperationException("A chave secreta JWT deve conter pelo menos 256 bits (32 bytes).");
        }

        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        _tokenHandler = new JwtSecurityTokenHandler
        {
            // Evita remapeamento automático de tipos de claims padrão
            MapInboundClaims = false
        };
    }

    public string GenerateAccessToken(User user, Guid sessionId)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("role", user.Role),
            new("sid", sessionId.ToString()),
            new("token_version", user.TokenVersion.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenLifetimeMinutes),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256)
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token, bool validateLifetime = true)
    {
        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtOptions.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _signingKey,
                ValidateLifetime = validateLifetime,
                ClockSkew = TimeSpan.Zero, // Sem tolerância de tempo extra para expiração estrita
                ValidAlgorithms = [SecurityAlgorithms.HmacSha256] // Lista explícita de algoritmos permitidos (rejeita 'none' ou assimétricos não esperados)
            };

            var principal = _tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    public string GenerateOpaqueToken(int byteLength = 32)
    {
        // Pelo menos 256 bits de entropia gerados pelo CSPRNG do sistema operacional
        byte[] bytes = RandomNumberGenerator.GetBytes(byteLength);
        return Base64UrlEncoder.Encode(bytes);
    }

    public string ComputeSha256Hash(string input)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public bool VerifySha256Hash(string input, string expectedHash)
    {
        string actualHash = ComputeSha256Hash(input);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(actualHash),
            Encoding.UTF8.GetBytes(expectedHash)
        );
    }
}
