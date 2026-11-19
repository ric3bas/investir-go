using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public sealed class ProventoRepository(DbConnectionFactory dbFactory) : IProventoRepository
{
    public async Task<IEnumerable<Provento>> ObterTodosAsync(string? ticker = null, int? ano = null, Guid? userId = null)
    {
        using var conn = dbFactory.CreateConnection();
        var sql = """
            SELECT p.id, p.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo,
                   p.tipo_provento AS TipoProvento, p.data_com AS DataCom,
                   p.data_pagamento AS DataPagamento, p.valor_por_cota AS ValorPorCota,
                   p.quantidade_cotas AS QuantidadeCotas, p.valor_total AS ValorTotal,
                   p.observacoes AS Observacoes, COALESCE(p.user_id, p.usuario_id) AS UserId,
                   p.created_at AS CreatedAt
            FROM inv.proventos p
            JOIN inv.ativos a ON a.id = p.ativo_id
            WHERE 1=1
        """;
        var parameters = new DynamicParameters();

        if (userId.HasValue)
        {
            sql += " AND (p.user_id = @UserId OR (p.user_id IS NULL AND p.usuario_id = @UserId))";
            parameters.Add("UserId", userId.Value);
        }
        if (!string.IsNullOrWhiteSpace(ticker))
        {
            sql += " AND UPPER(a.ticker) = UPPER(@Ticker)";
            parameters.Add("Ticker", ticker);
        }
        if (ano.HasValue)
        {
            sql += " AND EXTRACT(YEAR FROM p.data_pagamento) = @Ano";
            parameters.Add("Ano", ano.Value);
        }

        sql += " ORDER BY p.data_pagamento DESC, p.id DESC;";
        return await conn.QueryAsync<Provento>(sql, parameters);
    }

    public async Task<Provento?> ObterPorIdAsync(int id)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            SELECT p.id, p.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo,
                   p.tipo_provento AS TipoProvento, p.data_com AS DataCom,
                   p.data_pagamento AS DataPagamento, p.valor_por_cota AS ValorPorCota,
                   p.quantidade_cotas AS QuantidadeCotas, p.valor_total AS ValorTotal,
                   p.observacoes AS Observacoes, COALESCE(p.user_id, p.usuario_id) AS UserId,
                   p.created_at AS CreatedAt
            FROM inv.proventos p
            JOIN inv.ativos a ON a.id = p.ativo_id
            WHERE p.id = @Id;
        """;
        return await conn.QuerySingleOrDefaultAsync<Provento>(sql, new { Id = id });
    }

    public async Task<int> CriarAsync(Provento provento)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            INSERT INTO inv.proventos
                (ativo_id, user_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
            VALUES
                (@AtivoId, @UserId, @TipoProvento, @DataCom, @DataPagamento, @ValorPorCota, @QuantidadeCotas, @ValorTotal, @Observacoes)
            RETURNING id;
        """;
        return await conn.ExecuteScalarAsync<int>(sql, provento);
    }

    public async Task<bool> ExcluirAsync(int id)
    {
        using var conn = dbFactory.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM inv.proventos WHERE id = @Id;", new { Id = id }) > 0;
    }

    public async Task<decimal> ObterTotalProventosAsync(Guid? userId = null)
    {
        using var conn = dbFactory.CreateConnection();
        if (userId.HasValue)
        {
            const string userSql = """
                SELECT COALESCE(SUM(valor_total), 0)
                FROM inv.proventos
                WHERE user_id = @UserId OR (user_id IS NULL AND usuario_id = @UserId);
            """;
            return await conn.ExecuteScalarAsync<decimal>(userSql, new { UserId = userId.Value });
        }

        return await conn.ExecuteScalarAsync<decimal>("SELECT COALESCE(SUM(valor_total), 0) FROM inv.proventos;");
    }
}
