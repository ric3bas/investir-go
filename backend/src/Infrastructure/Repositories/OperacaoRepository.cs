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
                   a.preco_atual AS PrecoAtual, COALESCE(o.user_id, o.usuario_id) AS UserId,
                   o.created_at AS CreatedAt
            FROM inv.operacoes o
            JOIN inv.ativos a ON a.id = o.ativo_id
            WHERE 1=1
        """;
        var parameters = new DynamicParameters();

        if (userId.HasValue)
        {
            sql += " AND (o.user_id = @UserId OR (o.user_id IS NULL AND o.usuario_id = @UserId))";
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
                   a.preco_atual AS PrecoAtual, COALESCE(o.user_id, o.usuario_id) AS UserId,
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
}
