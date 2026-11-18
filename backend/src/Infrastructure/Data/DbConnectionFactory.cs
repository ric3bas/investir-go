using System.Data;
using Npgsql;

namespace InvestirGo.API.Infrastructure.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration configuration)
    {
        // EasyPanel, Railway e serviços semelhantes normalmente expõem uma URL
        // postgresql:// completa. Quando DATABASE_URL existir, ela tem precedência
        // sobre o valor local de appsettings.json.
        var databaseUrl = configuration["DATABASE_URL"];
        var configuredConnection = !string.IsNullOrWhiteSpace(databaseUrl)
            ? databaseUrl
            : configuration.GetConnectionString("DefaultConnection");

        _connectionString = NormalizeConnectionString(configuredConnection
            ?? "Host=localhost;Port=5432;Database=investir_db;Username=admin;Password=admin");
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }

    private static string NormalizeConnectionString(string value)
    {
        var trimmed = value.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
        {
            return trimmed;
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        if (userInfo.Length != 2 || string.IsNullOrWhiteSpace(uri.Host))
        {
            throw new InvalidOperationException("DATABASE_URL do PostgreSQL está incompleta.");
        }

        var database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
        if (string.IsNullOrWhiteSpace(database))
        {
            throw new InvalidOperationException("DATABASE_URL não informa o nome do banco de dados.");
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = database,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = Uri.UnescapeDataString(userInfo[1]),
            Pooling = true
        };

        return builder.ConnectionString;
    }
}
