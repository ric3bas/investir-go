using System.Security.Cryptography;
using System.Text;
using InvestirGo.API.Application.Security.Options;
using Konscious.Security.Cryptography;
using Microsoft.Extensions.Options;

namespace InvestirGo.API.Application.Security.Services;

public class Argon2idPasswordHasher : IPasswordHasher
{
    private readonly Argon2Options _options;
    private static readonly byte[] DummySalt = new byte[16];
    private static readonly byte[] DummyPasswordBytes = Encoding.UTF8.GetBytes("DummyPasswordToMitigateTimingAttacks123!");

    public Argon2idPasswordHasher(IOptions<SecurityOptions> options)
    {
        _options = options.Value.Argon2;
    }

    public string HashPassword(string password)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentException("Senha não pode ser vazia.", nameof(password));

        byte[] salt = RandomNumberGenerator.GetBytes(_options.SaltSizeBytes);
        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);

        using var argon2 = new Argon2id(passwordBytes)
        {
            Salt = salt,
            DegreeOfParallelism = _options.DegreeOfParallelism,
            MemorySize = _options.MemorySizeKb,
            Iterations = _options.Iterations
        };

        byte[] hash = argon2.GetBytes(_options.HashSizeBytes);

        // Formato padrão Modular Crypt Format (PHC string format)
        // $argon2id$v=19$m=<memory>,t=<iterations>,p=<parallelism>$<saltBase64>$<hashBase64>
        string saltBase64 = Convert.ToBase64String(salt);
        string hashBase64 = Convert.ToBase64String(hash);

        return $"$argon2id$v=19$m={_options.MemorySizeKb},t={_options.Iterations},p={_options.DegreeOfParallelism}${saltBase64}${hashBase64}";
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hashedPassword))
            return false;

        try
        {
            var parts = hashedPassword.Split('$');
            if (parts.Length != 6 || parts[1] != "argon2id")
                return false;

            // Formato esperado: "", "argon2id", "v=19", "m=...,t=...,p=...", "salt", "hash"
            var paramsPart = parts[3].Split(',');
            int memory = _options.MemorySizeKb;
            int iterations = _options.Iterations;
            int parallelism = _options.DegreeOfParallelism;

            foreach (var p in paramsPart)
            {
                var kv = p.Split('=');
                if (kv.Length == 2)
                {
                    if (kv[0] == "m" && int.TryParse(kv[1], out var m)) memory = m;
                    else if (kv[0] == "t" && int.TryParse(kv[1], out var t)) iterations = t;
                    else if (kv[0] == "p" && int.TryParse(kv[1], out var par)) parallelism = par;
                }
            }

            byte[] salt = Convert.FromBase64String(parts[4]);
            byte[] expectedHash = Convert.FromBase64String(parts[5]);

            byte[] passwordBytes = Encoding.UTF8.GetBytes(password);

            using var argon2 = new Argon2id(passwordBytes)
            {
                Salt = salt,
                DegreeOfParallelism = parallelism,
                MemorySize = memory,
                Iterations = iterations
            };

            byte[] actualHash = argon2.GetBytes(expectedHash.Length);

            // Comparação estritamente em tempo constante para evitar side-channel timing attacks
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch
        {
            return false;
        }
    }

    public void ExecuteDummyHash()
    {
        // Executa custo idêntico para que a ausência de um usuário leve o mesmo tempo que uma senha incorreta
        using var argon2 = new Argon2id(DummyPasswordBytes)
        {
            Salt = DummySalt,
            DegreeOfParallelism = _options.DegreeOfParallelism,
            MemorySize = _options.MemorySizeKb,
            Iterations = _options.Iterations
        };

        _ = argon2.GetBytes(_options.HashSizeBytes);
    }
}
