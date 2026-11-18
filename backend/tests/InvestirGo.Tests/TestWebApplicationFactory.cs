using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Options;
using InvestirGo.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InvestirGo.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["UseInMemoryAuth"] = "true",
                ["UseInMemoryPortfolio"] = "true",
                ["Security:EnforceHttps"] = "false", // Facilita execução em TestServer HTTP
                ["Security:Jwt:SecretKey"] = "InvestirGo_DevSecretKey_AtLeast32Bytes_ChangeInProduction2026!",
                ["Security:Jwt:AccessTokenLifetimeMinutes"] = "1",
                ["Security:Session:GraceWindowSeconds"] = "5"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Garante que IAuthRepository utilize o mesmo singleton InMemoryAuthRepository
            services.AddScoped<IAuthRepository>(sp => sp.GetRequiredService<InMemoryAuthRepository>());
        });
    }
}

