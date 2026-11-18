using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Application.Security.Services;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.API.Endpoints;

public static class ApiEndpoints
{
    public static void MapInvestirEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api");

        // ----------------- CARTEIRA -----------------
        group.MapGet("/carteira/posicoes", async (ICarteiraService carteiraService, ICurrentUserService currentUser) =>
        {
            var posicoes = await carteiraService.ObterPosicoesAsync(currentUser.UserId);
            return Results.Ok(posicoes);
        }).WithTags("Carteira").RequireAuthorization();

        group.MapGet("/carteira/resumo", async (ICarteiraService carteiraService, ICurrentUserService currentUser) =>
        {
            var resumo = await carteiraService.ObterResumoAsync(currentUser.UserId);
            return Results.Ok(resumo);
        }).WithTags("Carteira").RequireAuthorization();

        // ----------------- OPERAÇÕES (COMPRAS & VENDAS) -----------------
        group.MapGet("/operacoes", async (string? ticker, string? tipo, IOperacaoRepository operacaoRepo, ICurrentUserService currentUser) =>
        {
            var operacoes = await operacaoRepo.ObterTodasAsync(ticker, tipo, currentUser.UserId);
            return Results.Ok(operacoes);
        }).WithTags("Operacoes").RequireAuthorization();

        group.MapGet("/operacoes/{id:int}", async (int id, IOperacaoRepository operacaoRepo, ICurrentUserService currentUser) =>
        {
            var op = await operacaoRepo.ObterPorIdAsync(id);
            if (op is null) return Results.NotFound(new { message = "Operação não encontrada" });

            // Autorização por recurso: impede visualização de dados de outros usuários (IDOR)
            if (currentUser.IsAuthenticated && op.UserId.HasValue && op.UserId != currentUser.UserId && !currentUser.IsAdmin)
            {
                return Results.Problem(detail: "Acesso negado ao recurso solicitado.", statusCode: StatusCodes.Status403Forbidden);
            }

            return Results.Ok(op);
        }).WithTags("Operacoes").RequireAuthorization();

        group.MapPost("/operacoes", async (CriarOperacaoDto dto, IOperacaoRepository operacaoRepo, IAtivoRepository ativoRepo, ICurrentUserService currentUser) =>
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
                UserId = currentUser.UserId,
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
        }).WithTags("Operacoes").RequireAuthorization();

        group.MapDelete("/operacoes/{id:int}", async (int id, IOperacaoRepository operacaoRepo, ICurrentUserService currentUser) =>
        {
            var op = await operacaoRepo.ObterPorIdAsync(id);
            if (op is null) return Results.NotFound(new { message = "Operação não encontrada" });

            // Autorização por recurso: impede exclusão indevida de dados de outros usuários (IDOR)
            if (currentUser.IsAuthenticated && op.UserId.HasValue && op.UserId != currentUser.UserId && !currentUser.IsAdmin)
            {
                return Results.Problem(detail: "Acesso negado ao recurso solicitado.", statusCode: StatusCodes.Status403Forbidden);
            }

            var deletado = await operacaoRepo.ExcluirAsync(id);
            return deletado ? Results.NoContent() : Results.NotFound(new { message = "Operação não encontrada" });
        }).WithTags("Operacoes").RequireAuthorization();

        // ----------------- PROVENTOS -----------------
        group.MapGet("/proventos", async (string? ticker, int? ano, IProventoRepository proventoRepo, ICurrentUserService currentUser) =>
        {
            var proventos = await proventoRepo.ObterTodosAsync(ticker, ano, currentUser.UserId);
            return Results.Ok(proventos);
        }).WithTags("Proventos").RequireAuthorization();

        group.MapPost("/proventos", async (CriarProventoDto dto, IProventoRepository proventoRepo, IAtivoRepository ativoRepo, ICurrentUserService currentUser) =>
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
                UserId = currentUser.UserId,
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
        }).WithTags("Proventos").RequireAuthorization();

        group.MapDelete("/proventos/{id:int}", async (int id, IProventoRepository proventoRepo) =>
        {
            var deletado = await proventoRepo.ExcluirAsync(id);
            return deletado ? Results.NoContent() : Results.NotFound(new { message = "Provento não encontrado" });
        }).WithTags("Proventos").RequireAuthorization();

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

        // ----------------- HISTÓRICO ATÉ 5 ANOS (COM GRÁFICO) -----------------
        group.MapGet("/ativos/{ticker}/historico", async (string ticker, string? periodo, IAtivoRepository ativoRepo) =>
        {
            var ativo = await ativoRepo.ObterPorTickerAsync(ticker);
            var precoFinal = ativo?.PrecoAtual ?? 50.0m;
            var p = string.IsNullOrWhiteSpace(periodo) ? "5A" : periodo.ToUpper();

            decimal variacaoAlvo = p switch
            {
                "1D" => ativo?.VariacaoDia ?? 0.5m,
                "7D" => 3.2m,
                "15D" => 5.8m,
                "1M" => 7.5m,
                "6M" => 14.2m,
                "1A" => 22.4m,
                "2A" => 38.6m,
                _ => 52.8m // 5A
            };

            var precoInicial = Math.Round(precoFinal / (1 + (variacaoAlvo / 100m)), 2);
            var variacaoReais = Math.Round(precoFinal - precoInicial, 2);

            var pontos = new List<HistoricoPontoDto>();
            int qtdPontos = p == "1D" ? 8 : (p == "7D" ? 7 : (p == "15D" ? 15 : 24));

            for (int i = 0; i < qtdPontos; i++)
            {
                decimal progresso = (decimal)i / (qtdPontos - 1);
                decimal basePreco = precoInicial + (precoFinal - precoInicial) * progresso;
                decimal oscilacao = (decimal)Math.Sin(i * 0.9) * (precoFinal * 0.02m);
                decimal preco = Math.Max(0.5m, Math.Round(basePreco + (i == 0 || i == qtdPontos - 1 ? 0 : oscilacao), 2));
                decimal varPct = precoInicial > 0 ? Math.Round(((preco - precoInicial) / precoInicial) * 100m, 2) : 0;

                pontos.Add(new HistoricoPontoDto(
                    Data: $"P{i + 1}",
                    Preco: preco,
                    VariacaoPeriodo: varPct,
                    DataCompleta: $"Ponto {i + 1}"
                ));
            }

            var precos = pontos.Select(x => x.Preco).ToList();

            var historicoDto = new HistoricoAtivoDto(
                Ticker: ticker.ToUpper(),
                Nome: ativo?.Nome ?? ticker.ToUpper(),
                Periodo: p,
                PrecoInicial: precoInicial,
                PrecoFinal: precoFinal,
                VariacaoReais: variacaoReais,
                VariacaoPercentual: variacaoAlvo,
                Minima: precos.Min(),
                Maxima: precos.Max(),
                PrecoMedio: Math.Round(precos.Average(), 2),
                Pontos: pontos
            );

            return Results.Ok(historicoDto);
        }).WithTags("Ativos");

        // ----------------- PERFORMANCE & RANKING (TOP 7) -----------------
        group.MapGet("/ativos/performance", async (string? periodo, string? filtroTipo, IAtivoRepository ativoRepo) =>
        {
            var p = string.IsNullOrWhiteSpace(periodo) ? "1D" : periodo.ToUpper();
            var ativos = await ativoRepo.ObterTodosAsync();

            if (!string.IsNullOrWhiteSpace(filtroTipo) && !filtroTipo.Equals("TODOS", StringComparison.OrdinalIgnoreCase))
            {
                ativos = ativos.Where(a => a.Tipo.Equals(filtroTipo, StringComparison.OrdinalIgnoreCase));
            }

            var ranking = ativos.Select(a =>
            {
                decimal varPct = p switch
                {
                    "7D" => a.VariacaoDia * 2.8m,
                    "15D" => a.VariacaoDia * 4.5m,
                    _ => a.VariacaoDia
                };
                decimal pInicial = Math.Round(a.PrecoAtual / (1 + (varPct / 100m)), 2);
                decimal vReais = Math.Round(a.PrecoAtual - pInicial, 2);

                return new PerformanceAtivoDto(
                    Posicao: 0,
                    Ticker: a.Ticker,
                    Nome: a.Nome,
                    Tipo: a.Tipo,
                    Setor: a.Setor,
                    PrecoAtual: a.PrecoAtual,
                    PrecoInicial: pInicial,
                    VariacaoPercentual: Math.Round(varPct, 2),
                    VariacaoReais: vReais,
                    IsAlta: varPct >= 0
                );
            }).ToList();

            var top7Altas = ranking.OrderByDescending(r => r.VariacaoPercentual).Take(7).Select((r, idx) => r with { Posicao = idx + 1 }).ToList();
            var top7Baixas = ranking.OrderBy(r => r.VariacaoPercentual).Take(7).Select((r, idx) => r with { Posicao = idx + 1 }).ToList();

            return Results.Ok(new
            {
                Periodo = p,
                Top7Altas = top7Altas,
                Top7Baixas = top7Baixas,
                DestaqueAlta = top7Altas.FirstOrDefault(),
                DestaqueBaixa = top7Baixas.FirstOrDefault()
            });
        }).WithTags("Ativos");

        // ----------------- NOTÍCIAS & MERCADO -----------------
        group.MapGet("/noticias", () =>
        {
            var noticias = new List<NoticiaAtivoDto>
            {
                new("1", "PETR4", new[] { "PRIO3" }, "Petrobras aprova pagamento de R$ 13,8 bilhões em dividendos extraordinários", "O Conselho de Administração aprovou distribuição de proventos mantendo yield atrativo.", "InfoMoney", "Há 20 minutos", "Proventos", "Positivo"),
                new("2", "MXRF11", new[] { "CPTS11" }, "Maxi Renda (MXRF11) anuncia provento mensal e base atinge 1,1 milhão de cotistas", "Distribuição mensal estável com dividend yield anualizado acima de 12%.", "Funds Explorer", "Há 45 minutos", "Proventos", "Positivo"),
                new("3", "PRIO3", null, "PRIO atinge novo recorde de produção no Campo de Frade", "Produção diária supera estimativas com queda de 8% no custo de extração.", "Brazil Journal", "Há 1 hora", "Fato Relevante", "Positivo"),
                new("4", "VALE3", null, "Vale avança em negociações e amplia exportações de minério premium", "Companhia mantém liderança em minério de alto teor e avança em acordo de reparação.", "Valor Econômico", "Há 2 horas", "Resultado", "Neutro"),
                new("5", "BBAS3", new[] { "ITUB4" }, "Banco do Brasil registra ROE acima de 21% com crédito rural em alta", "Instituição financeira reforça projeção de lucros e payout sustentável para o exercício.", "Suno Research", "Há 2 horas", "Resultado", "Positivo"),
                new("6", "HGLG11", new[] { "BTLG11" }, "CSHG Logística renova contratos atípicos e zera vacância em galpões SP", "Contratos atípicos indexados ao IPCA trazem estabilidade para os próximos 5 anos.", "Clube FII", "Há 3 horas", "Fato Relevante", "Positivo"),
                new("7", "WEGE3", null, "WEG fecha contrato de US$ 120 milhões para fornecimento na Europa", "Multinacional expande negócios em inteligência industrial e transição energética.", "Valor Econômico", "Há 3 horas", "Fato Relevante", "Positivo"),
                new("8", "XPML11", new[] { "VISC11" }, "XP Malls conclui aquisição em shopping center premium com cap rate atraente", "Nova área locável impulsiona fluxo de receita do fundo imobiliário.", "InfoMoney", "Há 4 horas", "Fato Relevante", "Positivo")
            };
            return Results.Ok(noticias);
        }).WithTags("Noticias");
    }
}
