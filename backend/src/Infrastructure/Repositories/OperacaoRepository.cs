using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class OperacaoRepository : IOperacaoRepository
{
    private readonly DbConnectionFactory _dbFactory;

    private static readonly Guid _defaultUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly List<Operacao> _operacoesFallback = new()
    {
        new Operacao { Id = 1, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1500, PrecoUnitario = 17.94m, ValorTotal = 26910.00m, PrecoAtual = 14.62m, UserId = _defaultUserId },
        new Operacao { Id = 2, AtivoId = 2, Ticker = "TAEE4", NomeAtivo = "Transmissora Aliança de Energia Elétrica S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 14.08m, ValorTotal = 14080.00m, PrecoAtual = 13.70m, UserId = _defaultUserId },
        new Operacao { Id = 3, AtivoId = 3, Ticker = "ITSA4", NomeAtivo = "Itaúsa S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 1000, PrecoUnitario = 13.19m, ValorTotal = 13190.00m, PrecoAtual = 13.30m, UserId = _defaultUserId },
        new Operacao { Id = 4, AtivoId = 4, Ticker = "BBDC4", NomeAtivo = "Banco Bradesco S.A. PN", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 26), Quantidade = 700, PrecoUnitario = 15.55m, ValorTotal = 10885.00m, PrecoAtual = 14.41m, UserId = _defaultUserId },
        new Operacao { Id = 5, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 400, PrecoUnitario = 16.96m, ValorTotal = 6784.00m, PrecoAtual = 14.62m, UserId = _defaultUserId },
        new Operacao { Id = 6, AtivoId = 2, Ticker = "TAEE4", NomeAtivo = "Transmissora Aliança de Energia Elétrica S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 400, PrecoUnitario = 13.30m, ValorTotal = 5320.00m, PrecoAtual = 13.70m, UserId = _defaultUserId },
        new Operacao { Id = 7, AtivoId = 3, Ticker = "ITSA4", NomeAtivo = "Itaúsa S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 400, PrecoUnitario = 12.91m, ValorTotal = 5164.00m, PrecoAtual = 13.30m, UserId = _defaultUserId },
        new Operacao { Id = 8, AtivoId = 5, Ticker = "SANB4", NomeAtivo = "Banco Santander Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 400, PrecoUnitario = 12.52m, ValorTotal = 5008.00m, PrecoAtual = 14.14m, UserId = _defaultUserId },
        new Operacao { Id = 9, AtivoId = 6, Ticker = "POMO4", NomeAtivo = "Marcopolo S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 1300, PrecoUnitario = 3.82m, ValorTotal = 4966.00m, PrecoAtual = 3.85m, UserId = _defaultUserId },
        new Operacao { Id = 10, AtivoId = 7, Ticker = "BBDC3", NomeAtivo = "Banco Bradesco S.A. ON", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 28), Quantidade = 400, PrecoUnitario = 13.62m, ValorTotal = 5448.00m, PrecoAtual = 13.19m, UserId = _defaultUserId },
        new Operacao { Id = 11, AtivoId = 4, Ticker = "BBDC4", NomeAtivo = "Banco Bradesco S.A. PN", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 30), Quantidade = 100, PrecoUnitario = 14.04m, ValorTotal = 1404.00m, PrecoAtual = 14.41m, UserId = _defaultUserId },
        new Operacao { Id = 12, AtivoId = 5, Ticker = "SANB4", NomeAtivo = "Banco Santander Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 30), Quantidade = 200, PrecoUnitario = 12.07m, ValorTotal = 2414.00m, PrecoAtual = 14.14m, UserId = _defaultUserId },
        new Operacao { Id = 13, AtivoId = 3, Ticker = "ITSA4", NomeAtivo = "Itaúsa S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 10, 30), Quantidade = 200, PrecoUnitario = 12.50m, ValorTotal = 2500.00m, PrecoAtual = 13.30m, UserId = _defaultUserId },
        new Operacao { Id = 14, AtivoId = 4, Ticker = "BBDC4", NomeAtivo = "Banco Bradesco S.A. PN", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 11, 03), Quantidade = 300, PrecoUnitario = 13.54m, ValorTotal = 4062.00m, PrecoAtual = 14.41m, UserId = _defaultUserId },
        new Operacao { Id = 15, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 11, 03), Quantidade = 300, PrecoUnitario = 16.12m, ValorTotal = 4836.00m, PrecoAtual = 14.62m, UserId = _defaultUserId },
        new Operacao { Id = 16, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 11, 12), Quantidade = 1000, PrecoUnitario = 15.54m, ValorTotal = 15540.00m, PrecoAtual = 14.62m, UserId = _defaultUserId },
        new Operacao { Id = 17, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 11, 13), Quantidade = 800, PrecoUnitario = 15.14m, ValorTotal = 12112.00m, PrecoAtual = 14.62m, UserId = _defaultUserId },
        new Operacao { Id = 18, AtivoId = 1, Ticker = "BBAS3", NomeAtivo = "Banco do Brasil S.A.", TipoAtivo = "Acao", TipoOperacao = "COMPRA", DataOperacao = new DateTime(2026, 11, 17), Quantidade = 700, PrecoUnitario = 14.82m, ValorTotal = 10374.00m, PrecoAtual = 14.62m, UserId = _defaultUserId },
    };

    public OperacaoRepository(DbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<IEnumerable<Operacao>> ObterTodasAsync(string? ticker = null, string? tipoOperacao = null, Guid? userId = null)
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
            if (userId.HasValue)
            {
                sql += " AND (o.usuario_id = @UserId OR o.user_id = @UserId)";
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

            var result = (await conn.QueryAsync<Operacao>(sql, parameters)).ToList();
            return result;
        }
        catch { }

        // Fallback em memória para quando o banco estiver inacessível
        // Novos usuários (diferentes do usuário padrão da planilha) possuem carteira zerada
        if (userId.HasValue && userId.Value != _defaultUserId)
        {
            return Enumerable.Empty<Operacao>();
        }

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
                INSERT INTO inv.operacoes (ativo_id, user_id, usuario_id, tipo_operacao, data_operacao, quantidade, preco_unitario, valor_total, taxas, observacoes)
                VALUES (@AtivoId, @UserId, @UserId, UPPER(@TipoOperacao), @DataOperacao, @Quantidade, @PrecoUnitario, @ValorTotal, @Taxas, @Observacoes)
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
