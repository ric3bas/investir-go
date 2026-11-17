using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class ProventoRepository : IProventoRepository
{
    private readonly DbConnectionFactory _dbFactory;

    private static readonly List<Provento> _proventosFallback = new()
    {
        new Provento { Id = 1, AtivoId = 16, Ticker = "MXRF11", NomeAtivo = "Maxi Renda FII", TipoProvento = "Rendimento", DataCom = new DateTime(2026, 10, 31), DataPagamento = new DateTime(2026, 11, 14), ValorPorCota = 0.10m, QuantidadeCotas = 1500, ValorTotal = 150.00m, Observacoes = "Rendimento Novembro/2026" },
        new Provento { Id = 2, AtivoId = 4, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoProvento = "JCP", DataCom = new DateTime(2026, 10, 25), DataPagamento = new DateTime(2026, 11, 15), ValorPorCota = 0.38m, QuantidadeCotas = 1500, ValorTotal = 570.00m, Observacoes = "JCP 3T26" },
        new Provento { Id = 3, AtivoId = 6, Ticker = "TAEE4", NomeAtivo = "Transmissora Aliança S.A.", TipoProvento = "Dividendo", DataCom = new DateTime(2026, 10, 28), DataPagamento = new DateTime(2026, 11, 16), ValorPorCota = 0.32m, QuantidadeCotas = 1000, ValorTotal = 320.00m, Observacoes = "Dividendos Intercalares" },
        new Provento { Id = 4, AtivoId = 17, Ticker = "HGLG11", NomeAtivo = "CSHG Logística FII", TipoProvento = "Rendimento", DataCom = new DateTime(2026, 10, 31), DataPagamento = new DateTime(2026, 11, 14), ValorPorCota = 1.10m, QuantidadeCotas = 80, ValorTotal = 88.00m, Observacoes = "Rendimento Novembro/2026" },
        new Provento { Id = 5, AtivoId = 1, Ticker = "PETR4", NomeAtivo = "Petrobras", TipoProvento = "Dividendo", DataCom = new DateTime(2026, 10, 20), DataPagamento = new DateTime(2026, 11, 10), ValorPorCota = 1.15m, QuantidadeCotas = 500, ValorTotal = 575.00m, Observacoes = "Dividendos Extraordinários" },
        new Provento { Id = 6, AtivoId = 18, Ticker = "XPML11", NomeAtivo = "XP Malls FII", TipoProvento = "Rendimento", DataCom = new DateTime(2026, 10, 31), DataPagamento = new DateTime(2026, 11, 14), ValorPorCota = 0.92m, QuantidadeCotas = 120, ValorTotal = 110.40m, Observacoes = "Rendimento Novembro/2026" },
    };

    public ProventoRepository(DbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<IEnumerable<Provento>> ObterTodosAsync(string? ticker = null, int? ano = null)
    {
        try
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

            var result = await conn.QueryAsync<Provento>(sql, parameters);
            if (result.Any()) return result;
        }
        catch { }

        var filtrados = _proventosFallback.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(ticker))
        {
            filtrados = filtrados.Where(p => p.Ticker.Equals(ticker, StringComparison.OrdinalIgnoreCase));
        }
        if (ano.HasValue)
        {
            filtrados = filtrados.Where(p => p.DataPagamento.Year == ano.Value);
        }
        return filtrados.OrderByDescending(p => p.DataPagamento);
    }

    public async Task<Provento?> ObterPorIdAsync(int id)
    {
        try
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
            var result = await conn.QuerySingleOrDefaultAsync<Provento>(sql, new { Id = id });
            if (result is not null) return result;
        }
        catch { }

        return _proventosFallback.FirstOrDefault(p => p.Id == id);
    }

    public async Task<int> CriarAsync(Provento provento)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                INSERT INTO inv.proventos (ativo_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
                VALUES (@AtivoId, @TipoProvento, @DataCom, @DataPagamento, @ValorPorCota, @QuantidadeCotas, @ValorTotal, @Observacoes)
                RETURNING id;
            """;
            return await conn.ExecuteScalarAsync<int>(sql, provento);
        }
        catch
        {
            provento.Id = _proventosFallback.Any() ? _proventosFallback.Max(p => p.Id) + 1 : 1;
            _proventosFallback.Add(provento);
            return provento.Id;
        }
    }

    public async Task<bool> ExcluirAsync(int id)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = "DELETE FROM inv.proventos WHERE id = @Id;";
            var rows = await conn.ExecuteAsync(sql, new { Id = id });
            if (rows > 0) return true;
        }
        catch { }

        var item = _proventosFallback.FirstOrDefault(p => p.Id == id);
        if (item is not null)
        {
            _proventosFallback.Remove(item);
            return true;
        }
        return false;
    }

    public async Task<decimal> ObterTotalProventosAsync()
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = "SELECT COALESCE(SUM(valor_total), 0) FROM inv.proventos;";
            return await conn.ExecuteScalarAsync<decimal>(sql);
        }
        catch { }

        return _proventosFallback.Sum(p => p.ValorTotal);
    }
}
