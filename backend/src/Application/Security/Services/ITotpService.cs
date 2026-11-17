namespace InvestirGo.API.Application.Security.Services;

public interface ITotpService
{
    string GenerateSecret();
    string EncryptSecret(string plainSecret);
    string DecryptSecret(string encryptedSecret);
    string GenerateTotpUri(string email, string plainSecret);
    string GenerateQrCodePngBase64(string uri);
    bool VerifyCode(string plainSecret, string code, long? lastStep, out long matchedStep);
    List<string> GenerateRecoveryCodes(int count = 8);
    string HashRecoveryCode(string code);
}
