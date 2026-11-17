using InvestirGo.API.API.Endpoints;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Infrastructure.Data;
using InvestirGo.API.Infrastructure.Repositories;
using InvestirGo.API.Infrastructure.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configuração do Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "InvestirGo API", Version = "v1", Description = "API de Gestão de Investimentos, Carteira, Preço Médio e Proventos" });
});

// Injeção de Dependências
builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddScoped<IAtivoRepository, AtivoRepository>();
builder.Services.AddScoped<IOperacaoRepository, OperacaoRepository>();
builder.Services.AddScoped<IProventoRepository, ProventoRepository>();
builder.Services.AddScoped<ICarteiraService, CarteiraService>();

var app = builder.Build();

app.UseCors();

// Swagger em dev e prod para facilitar visualização
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "InvestirGo API v1");
    c.RoutePrefix = "swagger";
});

// Mapeamento dos endpoints
app.MapInvestirEndpoints();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
