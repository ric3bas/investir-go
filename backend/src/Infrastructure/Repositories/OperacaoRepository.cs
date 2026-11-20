using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public sealed class OperacaoRepository(DbConnectionFactory dbFactory) : IOperacaoRepository
{
    public async Task<IEnumerable<Operacao>> ObterTodasAsync(string? ticker = null, string? tipoOperacao = null, Guid? userId = null)
    {
        using var conn = dbFactory.CreateConnection();
        var sql = """
            SELECT o.id, o.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo, a.tipo AS TipoAtivo,
                   o.tipo_operacao AS TipoOperacao, o.data_operacao AS DataOperacao,
                   o.quantidade AS Quantidade, o.preco_unitario AS PrecoUnitario,
                   o.valor_total AS ValorTotal, o.taxas AS Taxas, o.observacoes AS Observacoes,
                   a.preco_atual AS PrecoAtual, o.user_id AS UserId,
                   o.created_at AS CreatedAt
            FROM inv.operacoes o
            JOIN inv.ativos a ON a.id = o.ativo_id
            WHERE 1=1
        """;
        var parameters = new DynamicParameters();

        if (userId.HasValue)
        {
            sql += " AND o.user_id = @UserId";
            parameters.Add("UserId", userId.Value);
        }
        if (!string.IsNullOrWhiteSpace(ticker))
        {
            sql += " AND UPPER(a.ticker) = UPPER(@Ticker)";
            parameters.Add("Ticker", ticker);
        }
        if (!string.IsNullOrWhiteSpace(tipoOperacao))
        {
            sql += " AND o.tipo_operacao = UPPER(@TipoOperacao)";
            parameters.Add("TipoOperacao", tipoOperacao);
        }

        sql += " ORDER BY o.data_operacao DESC, o.id DESC;";
        return await conn.QueryAsync<Operacao>(sql, parameters);
    }

    public async Task<Operacao?> ObterPorIdAsync(int id)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            SELECT o.id, o.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo, a.tipo AS TipoAtivo,
                   o.tipo_operacao AS TipoOperacao, o.data_operacao AS DataOperacao,
                   o.quantidade AS Quantidade, o.preco_unitario AS PrecoUnitario,
                   o.valor_total AS ValorTotal, o.taxas AS Taxas, o.observacoes AS Observacoes,
                   a.preco_atual AS PrecoAtual, o.user_id AS UserId,
                   o.created_at AS CreatedAt
            FROM inv.operacoes o
            JOIN inv.ativos a ON a.id = o.ativo_id
            WHERE o.id = @Id;
        """;
        return await conn.QuerySingleOrDefaultAsync<Operacao>(sql, new { Id = id });
    }

    public async Task<int> CriarAsync(Operacao operacao)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            INSERT INTO inv.operacoes
                (ativo_id, user_id, tipo_operacao, data_operacao, quantidade, preco_unitario, valor_total, taxas, observacoes)
            VALUES
                (@AtivoId, @UserId, UPPER(@TipoOperacao), @DataOperacao, @Quantidade, @PrecoUnitario, @ValorTotal, @Taxas, @Observacoes)
            RETURNING id;
        """;
        return await conn.ExecuteScalarAsync<int>(sql, operacao);
    }

    public async Task<bool> AtualizarAsync(Operacao operacao)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            UPDATE inv.operacoes
            SET ativo_id = @AtivoId,
                tipo_operacao = UPPER(@TipoOperacao),
                data_operacao = @DataOperacao,
                quantidade = @Quantidade,
                preco_unitario = @PrecoUnitario,
                valor_total = @ValorTotal,
                taxas = @Taxas,
                observacoes = @Observacoes
            WHERE id = @Id;
        """;
        return await conn.ExecuteAsync(sql, operacao) > 0;
    }

    public async Task<bool> ExcluirAsync(int id)
    {
        using var conn = dbFactory.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM inv.operacoes WHERE id = @Id;", new { Id = id }) > 0;
    }

    public async Task<int> ContarPorUsuarioAsync(Guid userId)
    {
        using var conn = dbFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM inv.operacoes WHERE user_id = @UserId;",
            new { UserId = userId });
    }

    public async Task<ResultadoSubstituicaoOperacoes> SubstituirPorImportacaoB3Async(
        Guid userId,
        IReadOnlyCollection<OperacaoImportacaoB3> operacoes)
    {
        if (operacoes.Count == 0)
            throw new ArgumentException("A importação deve conter ao menos uma operação.", nameof(operacoes));

        using var conn = dbFactory.CreateConnection();
        conn.Open();
        using var transaction = conn.BeginTransaction();

        try
        {
            var ativosParaCriar = operacoes
                .GroupBy(item => item.Ticker, StringComparer.OrdinalIgnoreCase)
                .Select(grupo => grupo
                    .OrderByDescending(item => item.DataOperacao)
                    .ThenByDescending(item => item.Linha)
                    .First())
                .Select(item => new
                {
                    Ticker = item.Ticker,
                    Nome = item.Ticker,
                    Tipo = "OTHER",
                    Setor = "Importado da B3",
                    PrecoAtual = item.PrecoUnitario
                })
                .ToArray();

            const string inserirAtivoSql = """
                INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual)
                VALUES (@Ticker, @Nome, @Tipo, @Setor, @PrecoAtual)
                ON CONFLICT (ticker) DO NOTHING;
            """;
            var ativosCriados = await conn.ExecuteAsync(inserirAtivoSql, ativosParaCriar, transaction);

            var tickers = ativosParaCriar.Select(item => item.Ticker).ToArray();
            const string buscarAtivosSql = """
                SELECT id AS Id, ticker AS Ticker
                FROM inv.ativos
                WHERE ticker = ANY(@Tickers);
            """;
            var ativos = await conn.QueryAsync<AtivoImportadoDb>(
                buscarAtivosSql,
                new { Tickers = tickers },
                transaction);
            var ativoIds = ativos.ToDictionary(item => item.Ticker, item => item.Id, StringComparer.OrdinalIgnoreCase);

            if (ativoIds.Count != tickers.Length)
                throw new InvalidOperationException("Não foi possível vincular todos os ativos da planilha.");

            var removidas = await conn.ExecuteAsync(
                "DELETE FROM inv.operacoes WHERE user_id = @UserId;",
                new { UserId = userId },
                transaction);

            var parametros = operacoes.Select(item => new
            {
                AtivoId = ativoIds[item.Ticker],
                UserId = userId,
                item.TipoOperacao,
                item.DataOperacao,
                item.Quantidade,
                item.PrecoUnitario,
                item.ValorTotal,
                Taxas = 0m,
                Observacoes = MontarObservacoes(item)
            }).ToArray();

            const string inserirOperacaoSql = """
                INSERT INTO inv.operacoes
                    (ativo_id, user_id, tipo_operacao, data_operacao, quantidade,
                     preco_unitario, valor_total, taxas, observacoes)
                VALUES
                    (@AtivoId, @UserId, @TipoOperacao, @DataOperacao, @Quantidade,
                     @PrecoUnitario, @ValorTotal, @Taxas, @Observacoes);
            """;
            var importadas = await conn.ExecuteAsync(inserirOperacaoSql, parametros, transaction);

            transaction.Commit();
            return new ResultadoSubstituicaoOperacoes(removidas, importadas, ativosCriados);
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    private static string MontarObservacoes(OperacaoImportacaoB3 item)
    {
        var detalhes = new List<string> { $"Linha {item.Linha}" };
        if (!string.IsNullOrWhiteSpace(item.Mercado)) detalhes.Add($"Mercado: {item.Mercado}");
        if (!string.IsNullOrWhiteSpace(item.PrazoVencimento) && item.PrazoVencimento != "-")
            detalhes.Add($"Prazo/Vencimento: {item.PrazoVencimento}");
        if (!string.IsNullOrWhiteSpace(item.Instituicao)) detalhes.Add($"Instituição: {item.Instituicao}");
        return $"Importação B3 | {string.Join(" | ", detalhes)}";
    }

    private sealed class AtivoImportadoDb
    {
        public int Id { get; init; }
        public string Ticker { get; init; } = string.Empty;
    }
}
