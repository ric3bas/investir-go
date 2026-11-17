namespace InvestirGo.API.Application.Security.Services;

public class PasswordValidator : IPasswordValidator
{
    private const int MinLength = 8;
    private const int MaxLength = 128; // Permite senhas longas geradas por password managers

    // Lista consolidada local das senhas mais comuns/vazadas (OWASP & Top Breached)
    // Avaliada localmente sem enviar senhas a APIs externas
    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "123456", "12345678", "123456789", "1234567890", "password", "password123",
        "qwerty", "qwertyuiop", "admin", "admin123", "welcome", "welcome123",
        "iloveyou", "monkey", "dragon", "master", "football", "baseball",
        "investir", "investir123", "investirgo", "secret", "senha123", "brasil",
        "mudar123", "trocar123", "teste123", "root", "default", "changeme",
        "111111", "123123", "654321", "trustno1", "letmein", "sunshine"
    };

    public (bool IsValid, string? ErrorMessage) Validate(string password, string? userEmail = null, string? userName = null)
    {
        if (string.IsNullOrWhiteSpace(password))
            return (false, "A senha não pode ser vazia.");

        if (password.Length < MinLength)
            return (false, $"A senha deve possuir no mínimo {MinLength} caracteres.");

        if (password.Length > MaxLength)
            return (false, $"A senha não pode exceder {MaxLength} caracteres.");

        if (CommonPasswords.Contains(password.Trim()))
            return (false, "A senha fornecida é extremamente comum e insegura. Escolha uma senha mais forte.");

        // Não permite que a senha seja idêntica ao e-mail ou nome
        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            var emailPrefix = userEmail.Split('@')[0];
            if (password.Equals(userEmail, StringComparison.OrdinalIgnoreCase) ||
                password.Equals(emailPrefix, StringComparison.OrdinalIgnoreCase))
            {
                return (false, "A senha não pode ser igual ao seu endereço de e-mail.");
            }
        }

        if (!string.IsNullOrWhiteSpace(userName) && password.Equals(userName, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "A senha não pode ser igual ao seu nome de usuário.");
        }

        return (true, null);
    }
}
