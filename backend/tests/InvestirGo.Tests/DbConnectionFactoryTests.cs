using InvestirGo.API.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace InvestirGo.Tests;

public class DbConnectionFactoryTests
{
    [Fact]
    public void DatabaseUrl_EasyPanel_IsConvertedToNpgsqlConnectionString()
    {
        var values = new Dictionary<string, string?>
        {
            ["DATABASE_URL"] = "postgresql://investir_app:p%40ss%3Aword@investir-go_db:5432/investir-go",
            ["ConnectionStrings:DefaultConnection"] = "Host=wrong-host;Database=wrong-db"
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var factory = new DbConnectionFactory(configuration);
        using var connection = Assert.IsType<NpgsqlConnection>(factory.CreateConnection());
        var parsed = new NpgsqlConnectionStringBuilder(connection.ConnectionString);

        Assert.Equal("investir-go_db", parsed.Host);
        Assert.Equal(5432, parsed.Port);
        Assert.Equal("investir-go", parsed.Database);
        Assert.Equal("investir_app", parsed.Username);
        Assert.Equal("p@ss:word", parsed.Password);
    }

    [Fact]
    public void DefaultConnection_IsUsedWhenDatabaseUrlIsAbsent()
    {
        var values = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=investir_db;Username=admin;Password=admin"
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var factory = new DbConnectionFactory(configuration);
        using var connection = Assert.IsType<NpgsqlConnection>(factory.CreateConnection());
        var parsed = new NpgsqlConnectionStringBuilder(connection.ConnectionString);

        Assert.Equal("localhost", parsed.Host);
        Assert.Equal("investir_db", parsed.Database);
    }
}
