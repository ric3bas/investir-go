using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class ProventoRepository : IProventoRepository
{
    private readonly DbConnectionFactory _dbFactory;

    public ProventoRepository(DbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<IEnumerable<Provento>> ObterTodosAsync(string? ticker = null, int? ano = null)
    {
        using var conn = _dbFactory.CreateConnection();
        var sql = """
            SELECT p.id, p.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo,
                   p.tipo_provento AS TipoProvento, p.data_com AS DataCom, 
                   p.data_pagamento AS DataPagamento, p.valor_por_cota AS ValorPorCota, 
                   p.quantidade_cotas AS QuantidadeCotas, p.valor_total AS ValorTotal, 
                   p.observacoes AS Observacoes, p.created_at AS CreatedAt
            FROM inv.proventos p
            JOIN inv.ativos a ON a.id = p.ativo_id
            WHERE 1=1
        """;

        var parameters = new DynamicParameters();
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
        using var conn = _dbFactory.CreateConnection();
        const string sql = """
            SELECT p.id, p.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo,
                   p.tipo_provento AS TipoProvento, p.data_com AS DataCom, 
                   p.data_pagamento AS DataPagamento, p.valor_por_cota AS ValorPorCota, 
                   p.quantidade_cotas AS QuantidadeCotas, p.valor_total AS ValorTotal, 
                   p.observacoes AS Observacoes, p.created_at AS CreatedAt
            FROM inv.proventos p
            JOIN inv.ativos a ON a.id = p.ativo_id
            WHERE p.id = @Id;
        """;
        return await conn.QuerySingleOrDefaultAsync<Provento>(sql, new { Id = id });
    }

    public async Task<int> CriarAsync(Provento provento)
    {
        using var conn = _dbFactory.CreateConnection();
        const string sql = """
            INSERT INTO inv.proventos (ativo_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
            VALUES (@AtivoId, @TipoProvento, @DataCom, @DataPagamento, @ValorPorCota, @QuantidadeCotas, @ValorTotal, @Observacoes)
            RETURNING id;
        """;
        return await conn.ExecuteScalarAsync<int>(sql, provento);
    }

    public async Task<bool> ExcluirAsync(int id)
    {
        using var conn = _dbFactory.CreateConnection();
        const string sql = "DELETE FROM inv.proventos WHERE id = @Id;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }

    public async Task<decimal> ObterTotalProventosAsync()
    {
        using var conn = _dbFactory.CreateConnection();
        const string sql = "SELECT COALESCE(SUM(valor_total), 0) FROM inv.proventos;";
        return await conn.ExecuteScalarAsync<decimal>(sql);
    }
}
