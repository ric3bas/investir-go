using System.Security.Cryptography;
using System.Text;
using InvestirGo.API.Application.Security.Options;
using Microsoft.Extensions.Options;
using OtpNet;
using QRCoder;

namespace InvestirGo.API.Application.Security.Services;

public class TotpService : ITotpService
{
    private readonly TotpOptions _options;
    private readonly byte[] _encryptionKey;

    public TotpService(IOptions<SecurityOptions> options)
    {
        _options = options.Value.Totp;
        _encryptionKey = Convert.FromBase64String(_options.EncryptionKeyBase64);
        if (_encryptionKey.Length != 32)
        {
            throw new InvalidOperationException("A chave de criptografia TOTP deve possuir exatamente 32 bytes (AES-256).");
        }
    }

    public string GenerateSecret()
    {
        // 20 bytes (160 bits) de entropia Base32 conforme RFC 6238
        byte[] secretBytes = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(secretBytes);
    }

    public string EncryptSecret(string plainSecret)
    {
        byte[] plaintextBytes = Encoding.UTF8.GetBytes(plainSecret);
        byte[] nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize); // 12 bytes
        byte[] tag = new byte[AesGcm.TagByteSizes.MaxSize]; // 16 bytes
        byte[] ciphertext = new byte[plaintextBytes.Length];

        using var aesGcm = new AesGcm(_encryptionKey, AesGcm.TagByteSizes.MaxSize);
        aesGcm.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // Formato serializado: nonce (12) + tag (16) + ciphertext
        byte[] result = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, result, nonce.Length + tag.Length, ciphertext.Length);

        return Convert.ToBase64String(result);
    }

    public string DecryptSecret(string encryptedSecret)
    {
        byte[] data = Convert.FromBase64String(encryptedSecret);
        int nonceSize = AesGcm.NonceByteSizes.MaxSize;
        int tagSize = AesGcm.TagByteSizes.MaxSize;

        if (data.Length < nonceSize + tagSize)
            throw new CryptographicException("Dado criptografado inválido.");

        byte[] nonce = new byte[nonceSize];
        byte[] tag = new byte[tagSize];
        byte[] ciphertext = new byte[data.Length - nonceSize - tagSize];

        Buffer.BlockCopy(data, 0, nonce, 0, nonceSize);
        Buffer.BlockCopy(data, nonceSize, tag, 0, tagSize);
        Buffer.BlockCopy(data, nonceSize + tagSize, ciphertext, 0, ciphertext.Length);

        byte[] plaintextBytes = new byte[ciphertext.Length];
        using var aesGcm = new AesGcm(_encryptionKey, tagSize);
        aesGcm.Decrypt(nonce, ciphertext, tag, plaintextBytes);

        return Encoding.UTF8.GetString(plaintextBytes);
    }

    public string GenerateTotpUri(string email, string plainSecret)
    {
        string encodedIssuer = Uri.EscapeDataString(_options.Issuer);
        string encodedEmail = Uri.EscapeDataString(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedEmail}?secret={plainSecret}&issuer={encodedIssuer}&algorithm=SHA1&digits={_options.TotpSize}&period={_options.StepSeconds}";
    }

    public string GenerateQrCodePngBase64(string uri)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(uri, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrCodeData);
        byte[] qrCodeBytes = qrCode.GetGraphic(10);
        return Convert.ToBase64String(qrCodeBytes);
    }

    public bool VerifyCode(string plainSecret, string code, long? lastStep, out long matchedStep)
    {
        matchedStep = 0;
        if (string.IsNullOrWhiteSpace(code) || code.Length != _options.TotpSize)
            return false;

        try
        {
            byte[] secretBytes = Base32Encoding.ToBytes(plainSecret);
            var totp = new Totp(secretBytes, step: _options.StepSeconds, totpSize: _options.TotpSize);

            // Janela de ±1 passo para tolerância de drift de relógio
            bool verified = totp.VerifyTotp(code.Trim(), out long stepMatched, new VerificationWindow(previous: 1, future: 1));

            if (!verified)
                return false;

            // Prevenção contra reutilização (replay attack) do mesmo código no mesmo time step
            if (lastStep.HasValue && stepMatched <= lastStep.Value)
            {
                return false; // Código já aceito recentemente
            }

            matchedStep = stepMatched;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public List<string> GenerateRecoveryCodes(int count = 8)
    {
        var codes = new List<string>();
        for (int i = 0; i < count; i++)
        {
            byte[] rawBytes = RandomNumberGenerator.GetBytes(5);
            string part1 = Convert.ToHexString(rawBytes[..2]).ToLowerInvariant();
            string part2 = Convert.ToHexString(rawBytes[2..]).ToLowerInvariant();
            codes.Add($"{part1}-{part2}");
        }
        return codes;
    }

    public string HashRecoveryCode(string code)
    {
        // Normaliza removendo hífens e espaços
        string normalized = code.Replace("-", "").Replace(" ", "").Trim().ToLowerInvariant();
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
