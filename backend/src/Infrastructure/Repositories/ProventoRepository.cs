using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class ProventoRepository : IProventoRepository
{
    private readonly DbConnectionFactory _dbFactory;
    private readonly bool _allowInMemoryFallback;

    private static readonly Guid _defaultUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly List<Provento> _proventosFallback = new()
    {
        new Provento { Id = 1, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoProvento = "Dividendo", DataCom = new DateTime(2026, 10, 31), DataPagamento = new DateTime(2026, 11, 10), ValorPorCota = 0.425000m, QuantidadeCotas = 2200, ValorTotal = 935.00m, Observacoes = "Dividendo 3T26", UserId = _defaultUserId },
        new Provento { Id = 2, AtivoId = 2, Ticker = "TAEE4", NomeAtivo = "Transmissora Aliança de Energia Elétrica S.A.", TipoProvento = "JCP", DataCom = new DateTime(2026, 11, 01), DataPagamento = new DateTime(2026, 11, 14), ValorPorCota = 0.284000m, QuantidadeCotas = 1400, ValorTotal = 397.60m, Observacoes = "JCP Intermediário", UserId = _defaultUserId },
        new Provento { Id = 3, AtivoId = 3, Ticker = "ITSA4", NomeAtivo = "Itaúsa S.A.", TipoProvento = "Dividendo", DataCom = new DateTime(2026, 11, 02), DataPagamento = new DateTime(2026, 11, 15), ValorPorCota = 0.152000m, QuantidadeCotas = 1600, ValorTotal = 243.20m, Observacoes = "Dividendo Mensal", UserId = _defaultUserId },
    };

    public ProventoRepository(DbConnectionFactory dbFactory, IConfiguration configuration)
    {
        _dbFactory = dbFactory;
        _allowInMemoryFallback = configuration.GetValue<bool>("UseInMemoryPortfolio", false);
    }

    public async Task<IEnumerable<Provento>> ObterTodosAsync(string? ticker = null, int? ano = null, Guid? userId = null)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            var sql = """
                SELECT p.id, p.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo,
                       p.tipo_provento AS TipoProvento, p.data_com AS DataCom, 
                       p.data_pagamento AS DataPagamento, p.valor_por_cota AS ValorPorCota, 
                       p.quantidade_cotas AS QuantidadeCotas, p.valor_total AS ValorTotal, 
                       p.observacoes AS Observacoes, COALESCE(p.user_id, p.usuario_id) AS UserId, p.created_at AS CreatedAt
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

            var result = (await conn.QueryAsync<Provento>(sql, parameters)).ToList();
            return result;
        }
        catch when (_allowInMemoryFallback) { }

        // Fallback em memória para quando o banco estiver inacessível
        // Novos usuários (diferentes do usuário padrão da planilha) possuem carteira zerada
        if (!_allowInMemoryFallback || (userId.HasValue && userId.Value != _defaultUserId))
        {
            return Enumerable.Empty<Provento>();
        }

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
                       p.observacoes AS Observacoes, COALESCE(p.user_id, p.usuario_id) AS UserId, p.created_at AS CreatedAt
                FROM inv.proventos p
                JOIN inv.ativos a ON a.id = p.ativo_id
                WHERE p.id = @Id;
            """;
            var result = await conn.QuerySingleOrDefaultAsync<Provento>(sql, new { Id = id });
            if (result is not null) return result;
        }
        catch when (_allowInMemoryFallback) { }

        return _allowInMemoryFallback ? _proventosFallback.FirstOrDefault(p => p.Id == id) : null;
    }

    public async Task<int> CriarAsync(Provento provento)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                INSERT INTO inv.proventos (ativo_id, user_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
                VALUES (@AtivoId, @UserId, @TipoProvento, @DataCom, @DataPagamento, @ValorPorCota, @QuantidadeCotas, @ValorTotal, @Observacoes)
                RETURNING id;
            """;
            return await conn.ExecuteScalarAsync<int>(sql, provento);
        }
        catch when (_allowInMemoryFallback)
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
        catch when (_allowInMemoryFallback) { }

        var item = _allowInMemoryFallback ? _proventosFallback.FirstOrDefault(p => p.Id == id) : null;
        if (item is not null)
        {
            _proventosFallback.Remove(item);
            return true;
        }
        return false;
    }

    public async Task<decimal> ObterTotalProventosAsync(Guid? userId = null)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            string sql;
            if (userId.HasValue)
            {
                sql = "SELECT COALESCE(SUM(valor_total), 0) FROM inv.proventos WHERE user_id = @UserId OR (user_id IS NULL AND usuario_id = @UserId);";
                return await conn.ExecuteScalarAsync<decimal>(sql, new { UserId = userId.Value });
            }
            else
            {
                sql = "SELECT COALESCE(SUM(valor_total), 0) FROM inv.proventos;";
                return await conn.ExecuteScalarAsync<decimal>(sql);
            }
        }
        catch when (_allowInMemoryFallback) { }

        if (!_allowInMemoryFallback || (userId.HasValue && userId.Value != _defaultUserId))
        {
            return 0m;
        }

        return _proventosFallback.Sum(p => p.ValorTotal);
    }
}
