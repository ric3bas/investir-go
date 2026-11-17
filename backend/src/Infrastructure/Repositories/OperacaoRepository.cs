using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class OperacaoRepository : IOperacaoRepository
{
    private readonly DbConnectionFactory _dbFactory;

    private static readonly List<Operacao> _operacoesFallback = new()
    {
        new Operacao { Id = 1, AtivoId = 4, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1500, PrecoUnitario = 17.94m, ValorTotal = 26910.00m, PrecoAtual = 14.95m },
        new Operacao { Id = 2, AtivoId = 6, Ticker = "TAEE4", NomeAtivo = "Transmissora Aliança S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 14.08m, ValorTotal = 14080.00m, PrecoAtual = 14.07m },
        new Operacao { Id = 3, AtivoId = 8, Ticker = "ITSA4", NomeAtivo = "Itaúsa S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 13.19m, ValorTotal = 13190.00m, PrecoAtual = 13.39m },
        new Operacao { Id = 4, AtivoId = 5, Ticker = "BBDC4", NomeAtivo = "Banco Bradesco S.A. PN", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 14.78m, ValorTotal = 14780.00m, PrecoAtual = 14.23m },
        new Operacao { Id = 5, AtivoId = 9, Ticker = "SANB4", NomeAtivo = "Banco Santander Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 14.73m, ValorTotal = 14730.00m, PrecoAtual = 14.09m },
        new Operacao { Id = 6, AtivoId = 10, Ticker = "POMO4", NomeAtivo = "Marcopolo S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 3000, PrecoUnitario = 3.42m, ValorTotal = 10260.00m, PrecoAtual = 3.81m },
        new Operacao { Id = 7, AtivoId = 11, Ticker = "BBDC3", NomeAtivo = "Banco Bradesco S.A. ON", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 13.56m, ValorTotal = 13560.00m, PrecoAtual = 13.00m },
        new Operacao { Id = 8, AtivoId = 1, Ticker = "PETR4", NomeAtivo = "Petrobras", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 27), Quantidade = 500, PrecoUnitario = 36.20m, ValorTotal = 18100.00m, PrecoAtual = 37.85m },
        new Operacao { Id = 9, AtivoId = 2, Ticker = "VALE3", NomeAtivo = "Vale S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 27), Quantidade = 300, PrecoUnitario = 61.50m, ValorTotal = 18450.00m, PrecoAtual = 58.20m },
        new Operacao { Id = 10, AtivoId = 3, Ticker = "ITUB4", NomeAtivo = "Itaú Unibanco", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 27), Quantidade = 400, PrecoUnitario = 33.10m, ValorTotal = 13240.00m, PrecoAtual = 34.60m },
        new Operacao { Id = 11, AtivoId = 16, Ticker = "MXRF11", NomeAtivo = "Maxi Renda FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 1500, PrecoUnitario = 10.35m, ValorTotal = 15525.00m, PrecoAtual = 10.15m },
        new Operacao { Id = 12, AtivoId = 17, Ticker = "HGLG11", NomeAtivo = "CSHG Logística FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 80, PrecoUnitario = 163.20m, ValorTotal = 13056.00m, PrecoAtual = 161.50m },
        new Operacao { Id = 13, AtivoId = 18, Ticker = "XPML11", NomeAtivo = "XP Malls FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 120, PrecoUnitario = 108.50m, ValorTotal = 13020.00m, PrecoAtual = 107.20m },
        new Operacao { Id = 14, AtivoId = 19, Ticker = "KNIP11", NomeAtivo = "Kinea IPCA FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 150, PrecoUnitario = 93.40m, ValorTotal = 14010.00m, PrecoAtual = 91.80m },
        new Operacao { Id = 15, AtivoId = 20, Ticker = "KNCR11", NomeAtivo = "Kinea CDI FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 100, PrecoUnitario = 102.80m, ValorTotal = 10280.00m, PrecoAtual = 104.30m },
        new Operacao { Id = 16, AtivoId = 21, Ticker = "BTLG11", NomeAtivo = "BTG Logística FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 110, PrecoUnitario = 98.70m, ValorTotal = 10857.00m, PrecoAtual = 99.40m },
        new Operacao { Id = 17, AtivoId = 22, Ticker = "VISC11", NomeAtivo = "Vinci Shoppings FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 90, PrecoUnitario = 116.20m, ValorTotal = 10458.00m, PrecoAtual = 114.80m },
        new Operacao { Id = 18, AtivoId = 23, Ticker = "HGRU11", NomeAtivo = "CSHG Renda Urbana FII", TipoAtivo = "FII", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 70, PrecoUnitario = 126.00m, ValorTotal = 8820.00m, PrecoAtual = 124.60m },
    };

    public OperacaoRepository(DbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<IEnumerable<Operacao>> ObterTodasAsync(string? ticker = null, string? tipoOperacao = null)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            var sql = """
                SELECT o.id, o.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo, a.tipo AS TipoAtivo,
                       o.tipo_operacao AS TipoOperacao, o.data_operacao AS DataOperacao, 
                       o.quantidade AS Quantidade, o.preco_unitario AS PrecoUnitario, 
                       o.valor_total AS ValorTotal, o.taxas AS Taxas, o.observacoes AS Observacoes,
                       a.preco_atual AS PrecoAtual, o.created_at AS CreatedAt
                FROM inv.operacoes o
                JOIN inv.ativos a ON a.id = o.ativo_id
                WHERE 1=1
            """;

            var parameters = new DynamicParameters();
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

            var result = await conn.QueryAsync<Operacao>(sql, parameters);
            if (result.Any()) return result;
        }
        catch { }

        var filtradas = _operacoesFallback.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(ticker))
        {
            filtradas = filtradas.Where(o => o.Ticker.Equals(ticker, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(tipoOperacao))
        {
            filtradas = filtradas.Where(o => o.TipoOperacao.Equals(tipoOperacao, StringComparison.OrdinalIgnoreCase));
        }
        return filtradas.OrderByDescending(o => o.DataOperacao);
    }

    public async Task<Operacao?> ObterPorIdAsync(int id)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                SELECT o.id, o.ativo_id AS AtivoId, a.ticker AS Ticker, a.nome AS NomeAtivo, a.tipo AS TipoAtivo,
                       o.tipo_operacao AS TipoOperacao, o.data_operacao AS DataOperacao, 
                       o.quantidade AS Quantidade, o.preco_unitario AS PrecoUnitario, 
                       o.valor_total AS ValorTotal, o.taxas AS Taxas, o.observacoes AS Observacoes,
                       a.preco_atual AS PrecoAtual, o.created_at AS CreatedAt
                FROM inv.operacoes o
                JOIN inv.ativos a ON a.id = o.ativo_id
                WHERE o.id = @Id;
            """;
            var result = await conn.QuerySingleOrDefaultAsync<Operacao>(sql, new { Id = id });
            if (result is not null) return result;
        }
        catch { }

        return _operacoesFallback.FirstOrDefault(o => o.Id == id);
    }

    public async Task<int> CriarAsync(Operacao operacao)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                INSERT INTO inv.operacoes (ativo_id, tipo_operacao, data_operacao, quantidade, preco_unitario, valor_total, taxas, observacoes)
                VALUES (@AtivoId, UPPER(@TipoOperacao), @DataOperacao, @Quantidade, @PrecoUnitario, @ValorTotal, @Taxas, @Observacoes)
                RETURNING id;
            """;
            return await conn.ExecuteScalarAsync<int>(sql, operacao);
        }
        catch
        {
            operacao.Id = _operacoesFallback.Any() ? _operacoesFallback.Max(o => o.Id) + 1 : 1;
            _operacoesFallback.Add(operacao);
            return operacao.Id;
        }
    }

    public async Task<bool> AtualizarAsync(Operacao operacao)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
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
            var rows = await conn.ExecuteAsync(sql, operacao);
            if (rows > 0) return true;
        }
        catch { }

        var item = _operacoesFallback.FirstOrDefault(o => o.Id == operacao.Id);
        if (item is not null)
        {
            item.Quantidade = operacao.Quantidade;
            item.PrecoUnitario = operacao.PrecoUnitario;
            item.ValorTotal = operacao.ValorTotal;
            item.DataOperacao = operacao.DataOperacao;
            item.Observacoes = operacao.Observacoes;
            return true;
        }
        return false;
    }

    public async Task<bool> ExcluirAsync(int id)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = "DELETE FROM inv.operacoes WHERE id = @Id;";
            var rows = await conn.ExecuteAsync(sql, new { Id = id });
            if (rows > 0) return true;
        }
        catch { }

        var item = _operacoesFallback.FirstOrDefault(o => o.Id == id);
        if (item is not null)
        {
            _operacoesFallback.Remove(item);
            return true;
        }
        return false;
    }
}
