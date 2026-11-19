using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Options;
using InvestirGo.API.Application.Security.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace InvestirGo.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:EnforceHttps"] = "false", // Facilita execução em TestServer HTTP
                ["Security:Jwt:SecretKey"] = "InvestirGo_DevSecretKey_AtLeast32Bytes_ChangeInProduction2026!",
                ["Security:Jwt:AccessTokenLifetimeMinutes"] = "1",
                ["Security:Session:GraceWindowSeconds"] = "5"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Dublês existem somente no assembly de testes e nunca são publicados.
            services.RemoveAll<IHostedService>();
            services.RemoveAll<IAuthRepository>();
            services.RemoveAll<IRateLimiterService>();
            services.RemoveAll<IOperacaoRepository>();
            services.AddSingleton<IAuthRepository, TestAuthRepository>();
            services.AddSingleton<IRateLimiterService, TestRateLimiterService>();
            services.AddSingleton<IOperacaoRepository, TestOperacaoRepository>();
        });
    }
}

