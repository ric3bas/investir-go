using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public sealed class AtivoRepository(DbConnectionFactory dbFactory) : IAtivoRepository
{
    public async Task<IEnumerable<Ativo>> ObterTodosAsync()
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            SELECT id, ticker, nome, tipo, setor, preco_atual AS PrecoAtual,
                   variacao_dia AS VariacaoDia, dividend_yield AS DividendYield,
                   data_atualizacao AS DataAtualizacao, created_at AS CreatedAt
            FROM inv.ativos
            ORDER BY tipo, ticker;
        """;
        return await conn.QueryAsync<Ativo>(sql);
    }

    public async Task<Ativo?> ObterPorIdAsync(int id)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            SELECT id, ticker, nome, tipo, setor, preco_atual AS PrecoAtual,
                   variacao_dia AS VariacaoDia, dividend_yield AS DividendYield,
                   data_atualizacao AS DataAtualizacao, created_at AS CreatedAt
            FROM inv.ativos
            WHERE id = @Id;
        """;
        return await conn.QuerySingleOrDefaultAsync<Ativo>(sql, new { Id = id });
    }

    public async Task<Ativo?> ObterPorTickerAsync(string ticker)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            SELECT id, ticker, nome, tipo, setor, preco_atual AS PrecoAtual,
                   variacao_dia AS VariacaoDia, dividend_yield AS DividendYield,
                   data_atualizacao AS DataAtualizacao, created_at AS CreatedAt
            FROM inv.ativos
            WHERE UPPER(ticker) = UPPER(@Ticker);
        """;
        return await conn.QuerySingleOrDefaultAsync<Ativo>(sql, new { Ticker = ticker });
    }

    public async Task<int> CriarAsync(Ativo ativo)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual, variacao_dia, dividend_yield)
            VALUES (UPPER(@Ticker), @Nome, @Tipo, @Setor, @PrecoAtual, @VariacaoDia, @DividendYield)
            RETURNING id;
        """;
        return await conn.ExecuteScalarAsync<int>(sql, ativo);
    }

    public async Task<bool> AtualizarCotacaoAsync(int id, decimal precoAtual, decimal? variacaoDia, decimal? dividendYield)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            UPDATE inv.ativos
            SET preco_atual = @PrecoAtual,
                variacao_dia = COALESCE(@VariacaoDia, variacao_dia),
                dividend_yield = COALESCE(@DividendYield, dividend_yield),
                data_atualizacao = CURRENT_TIMESTAMP
            WHERE id = @Id;
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            PrecoAtual = precoAtual,
            VariacaoDia = variacaoDia,
            DividendYield = dividendYield
        });
        return rows > 0;
    }

    public async Task<bool> AtualizarTipoAsync(int id, string tipo)
    {
        using var conn = dbFactory.CreateConnection();
        const string sql = """
            UPDATE inv.ativos
            SET tipo = @Tipo,
                data_atualizacao = NOW()
            WHERE id = @Id;
        """;
        return await conn.ExecuteAsync(sql, new { Id = id, Tipo = tipo }) > 0;
    }
}
