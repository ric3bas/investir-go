using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.API.Endpoints;

public static class ApiEndpoints
{
    public static void MapInvestirEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api");

        // ----------------- CARTEIRA -----------------
        group.MapGet("/carteira/posicoes", async (ICarteiraService carteiraService) =>
        {
            var posicoes = await carteiraService.ObterPosicoesAsync();
            return Results.Ok(posicoes);
        }).WithTags("Carteira");

        group.MapGet("/carteira/resumo", async (ICarteiraService carteiraService) =>
        {
            var resumo = await carteiraService.ObterResumoAsync();
            return Results.Ok(resumo);
        }).WithTags("Carteira");

        // ----------------- OPERAÇÕES (COMPRAS & VENDAS) -----------------
        group.MapGet("/operacoes", async (string? ticker, string? tipo, IOperacaoRepository operacaoRepo) =>
        {
            var operacoes = await operacaoRepo.ObterTodasAsync(ticker, tipo);
            return Results.Ok(operacoes);
        }).WithTags("Operacoes");

        group.MapGet("/operacoes/{id:int}", async (int id, IOperacaoRepository operacaoRepo) =>
        {
            var op = await operacaoRepo.ObterPorIdAsync(id);
            return op is not null ? Results.Ok(op) : Results.NotFound(new { message = "Operação não encontrada" });
        }).WithTags("Operacoes");

        group.MapPost("/operacoes", async (CriarOperacaoDto dto, IOperacaoRepository operacaoRepo, IAtivoRepository ativoRepo) =>
        {
            if (dto.Quantidade <= 0 || dto.PrecoUnitario <= 0)
            {
                return Results.BadRequest(new { message = "Quantidade e Preço Unitário devem ser maiores que zero." });
            }

            int ativoId = dto.AtivoId ?? 0;
            if (ativoId <= 0 && !string.IsNullOrWhiteSpace(dto.Ticker))
            {
                var ativoExistente = await ativoRepo.ObterPorTickerAsync(dto.Ticker.Trim().ToUpper());
                if (ativoExistente is null)
                {
                    // Se o ativo não existe no catálogo, cria automaticamente
                    ativoId = await ativoRepo.CriarAsync(new Ativo
                    {
                        Ticker = dto.Ticker.Trim().ToUpper(),
                        Nome = dto.Ticker.Trim().ToUpper(),
                        Tipo = dto.Ticker.Trim().ToUpper().EndsWith("11") ? "FII" : "Acao",
                        PrecoAtual = dto.PrecoUnitario
                    });
                }
                else
                {
                    ativoId = ativoExistente.Id;
                }
            }

            if (ativoId <= 0)
            {
                return Results.BadRequest(new { message = "Ativo não informado ou inválido." });
            }

            var operacao = new Operacao
            {
                AtivoId = ativoId,
                TipoOperacao = dto.TipoOperacao.Trim().ToUpper(),
                DataOperacao = dto.DataOperacao == default ? DateTime.UtcNow.Date : dto.DataOperacao.Date,
                Quantidade = dto.Quantidade,
                PrecoUnitario = dto.PrecoUnitario,
                ValorTotal = dto.Quantidade * dto.PrecoUnitario,
                Taxas = dto.Taxas,
                Observacoes = dto.Observacoes
            };

            var id = await operacaoRepo.CriarAsync(operacao);
            operacao.Id = id;

            return Results.Created($"/api/operacoes/{id}", operacao);
        }).WithTags("Operacoes");

        group.MapDelete("/operacoes/{id:int}", async (int id, IOperacaoRepository operacaoRepo) =>
        {
            var deletado = await operacaoRepo.ExcluirAsync(id);
            return deletado ? Results.NoContent() : Results.NotFound(new { message = "Operação não encontrada" });
        }).WithTags("Operacoes");

        // ----------------- PROVENTOS -----------------
        group.MapGet("/proventos", async (string? ticker, int? ano, IProventoRepository proventoRepo) =>
        {
            var proventos = await proventoRepo.ObterTodosAsync(ticker, ano);
            return Results.Ok(proventos);
        }).WithTags("Proventos");

        group.MapPost("/proventos", async (CriarProventoDto dto, IProventoRepository proventoRepo, IAtivoRepository ativoRepo) =>
        {
            int ativoId = dto.AtivoId ?? 0;
            if (ativoId <= 0 && !string.IsNullOrWhiteSpace(dto.Ticker))
            {
                var ativo = await ativoRepo.ObterPorTickerAsync(dto.Ticker.Trim().ToUpper());
                if (ativo is null)
                {
                    return Results.BadRequest(new { message = $"Ativo '{dto.Ticker}' não encontrado." });
                }
                ativoId = ativo.Id;
            }

            if (ativoId <= 0)
            {
                return Results.BadRequest(new { message = "Ativo não informado ou inválido." });
            }

            var provento = new Provento
            {
                AtivoId = ativoId,
                TipoProvento = dto.TipoProvento,
                DataCom = dto.DataCom,
                DataPagamento = dto.DataPagamento == default ? DateTime.UtcNow.Date : dto.DataPagamento.Date,
                ValorPorCota = dto.ValorPorCota,
                QuantidadeCotas = dto.QuantidadeCotas,
                ValorTotal = dto.ValorTotal > 0 ? dto.ValorTotal : (dto.ValorPorCota * dto.QuantidadeCotas),
                Observacoes = dto.Observacoes
            };

            var id = await proventoRepo.CriarAsync(provento);
            provento.Id = id;

            return Results.Created($"/api/proventos/{id}", provento);
        }).WithTags("Proventos");

        group.MapDelete("/proventos/{id:int}", async (int id, IProventoRepository proventoRepo) =>
        {
            var deletado = await proventoRepo.ExcluirAsync(id);
            return deletado ? Results.NoContent() : Results.NotFound(new { message = "Provento não encontrado" });
        }).WithTags("Proventos");

        // ----------------- ATIVOS (TOP 30 E CATÁLOGO) -----------------
        group.MapGet("/ativos", async (IAtivoRepository ativoRepo) =>
        {
            var ativos = await ativoRepo.ObterTodosAsync();
            return Results.Ok(ativos);
        }).WithTags("Ativos");

        group.MapGet("/ativos/{ticker}", async (string ticker, IAtivoRepository ativoRepo) =>
        {
            var ativo = await ativoRepo.ObterPorTickerAsync(ticker);
            return ativo is not null ? Results.Ok(ativo) : Results.NotFound(new { message = "Ativo não encontrado" });
        }).WithTags("Ativos");

        group.MapPost("/ativos", async (CriarAtivoDto dto, IAtivoRepository ativoRepo) =>
        {
            var existente = await ativoRepo.ObterPorTickerAsync(dto.Ticker);
            if (existente is not null)
            {
                return Results.Conflict(new { message = $"Ativo com ticker {dto.Ticker} já cadastrado." });
            }

            var ativo = new Ativo
            {
                Ticker = dto.Ticker.Trim().ToUpper(),
                Nome = dto.Nome,
                Tipo = dto.Tipo,
                Setor = dto.Setor,
                PrecoAtual = dto.PrecoAtual,
                VariacaoDia = dto.VariacaoDia,
                DividendYield = dto.DividendYield
            };

            var id = await ativoRepo.CriarAsync(ativo);
            ativo.Id = id;

            return Results.Created($"/api/ativos/{ativo.Ticker}", ativo);
        }).WithTags("Ativos");

        group.MapPut("/ativos/{id:int}/cotacao", async (int id, AtualizarCotacaoDto dto, IAtivoRepository ativoRepo) =>
        {
            var atualizado = await ativoRepo.AtualizarCotacaoAsync(id, dto.PrecoAtual, dto.VariacaoDia, dto.DividendYield);
            return atualizado ? Results.Ok(new { message = "Cotação atualizada com sucesso" }) : Results.NotFound(new { message = "Ativo não encontrado" });
        }).WithTags("Ativos");
    }
}
