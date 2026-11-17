using Dapper;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Data;

namespace InvestirGo.API.Infrastructure.Repositories;

public class AtivoRepository : IAtivoRepository
{
    private readonly DbConnectionFactory _dbFactory;

    // Base local em memória como fallback caso PostgreSQL esteja offline
    private static readonly List<Ativo> _ativosFallback = new()
    {
        // 15 Ações
        new Ativo { Id = 1, Ticker = "BBAS3", Nome = "Banco do Brasil S.A.", Tipo = "Acao", Setor = "Financeiro / Bancos", PrecoAtual = 14.62m, VariacaoDia = 0.45m, DividendYield = 9.85m },
        new Ativo { Id = 2, Ticker = "TAEE4", Nome = "Transmissora Aliança de Energia Elétrica S.A.", Tipo = "Acao", Setor = "Energia Elétrica", PrecoAtual = 13.70m, VariacaoDia = -0.15m, DividendYield = 8.90m },
        new Ativo { Id = 3, Ticker = "ITSA4", Nome = "Itaúsa S.A.", Tipo = "Acao", Setor = "Financeiro / Holdings", PrecoAtual = 13.30m, VariacaoDia = 0.60m, DividendYield = 8.20m },
        new Ativo { Id = 4, Ticker = "BBDC4", Nome = "Banco Bradesco S.A. PN", Tipo = "Acao", Setor = "Financeiro / Bancos", PrecoAtual = 14.41m, VariacaoDia = 0.28m, DividendYield = 7.50m },
        new Ativo { Id = 5, Ticker = "SANB4", Nome = "Banco Santander Brasil S.A.", Tipo = "Acao", Setor = "Financeiro / Bancos", PrecoAtual = 14.14m, VariacaoDia = 0.50m, DividendYield = 7.80m },
        new Ativo { Id = 6, Ticker = "POMO4", Nome = "Marcopolo S.A.", Tipo = "Acao", Setor = "Material de Transporte", PrecoAtual = 3.85m, VariacaoDia = -0.26m, DividendYield = 6.40m },
        new Ativo { Id = 7, Ticker = "BBDC3", Nome = "Banco Bradesco S.A. ON", Tipo = "Acao", Setor = "Financeiro / Bancos", PrecoAtual = 13.19m, VariacaoDia = 0.15m, DividendYield = 7.10m },
        new Ativo { Id = 8, Ticker = "PETR4", Nome = "Petróleo Brasileiro S.A. Petrobras", Tipo = "Acao", Setor = "Petróleo, Gás e Biocombustíveis", PrecoAtual = 37.85m, VariacaoDia = 1.20m, DividendYield = 14.20m },
        new Ativo { Id = 9, Ticker = "VALE3", Nome = "Vale S.A.", Tipo = "Acao", Setor = "Mineração", PrecoAtual = 58.20m, VariacaoDia = -0.80m, DividendYield = 8.40m },
        new Ativo { Id = 10, Ticker = "ITUB4", Nome = "Itaú Unibanco Holding S.A.", Tipo = "Acao", Setor = "Financeiro / Bancos", PrecoAtual = 34.60m, VariacaoDia = 0.75m, DividendYield = 7.90m },
        new Ativo { Id = 11, Ticker = "TAEE11", Nome = "Taesa Unit", Tipo = "Acao", Setor = "Energia Elétrica", PrecoAtual = 34.80m, VariacaoDia = 0.10m, DividendYield = 9.10m },
        new Ativo { Id = 12, Ticker = "WEGE3", Nome = "WEG S.A.", Tipo = "Acao", Setor = "Motores e Equipamentos Elétricos", PrecoAtual = 52.40m, VariacaoDia = 1.45m, DividendYield = 1.80m },
        new Ativo { Id = 13, Ticker = "ABEV3", Nome = "Ambev S.A.", Tipo = "Acao", Setor = "Bebidas", PrecoAtual = 12.80m, VariacaoDia = -0.30m, DividendYield = 6.20m },
        new Ativo { Id = 14, Ticker = "RENT3", Nome = "Localiza Rent a Car S.A.", Tipo = "Acao", Setor = "Locação de Veículos", PrecoAtual = 44.50m, VariacaoDia = 0.90m, DividendYield = 3.50m },
        new Ativo { Id = 15, Ticker = "PRIO3", Nome = "PRIO S.A.", Tipo = "Acao", Setor = "Petróleo e Gás Independente", PrecoAtual = 42.10m, VariacaoDia = 2.10m, DividendYield = 0.00m },

        // 15 FIIs
        new Ativo { Id = 16, Ticker = "MXRF11", Nome = "Maxi Renda FII", Tipo = "FII", Setor = "Papel / CRI", PrecoAtual = 10.15m, VariacaoDia = 0.10m, DividendYield = 12.40m },
        new Ativo { Id = 17, Ticker = "HGLG11", Nome = "CSHG Logística FII", Tipo = "FII", Setor = "Logística / Galpões", PrecoAtual = 161.50m, VariacaoDia = 0.35m, DividendYield = 8.60m },
        new Ativo { Id = 18, Ticker = "XPML11", Nome = "XP Malls FII", Tipo = "FII", Setor = "Shopping Centers", PrecoAtual = 107.20m, VariacaoDia = 0.20m, DividendYield = 9.10m },
        new Ativo { Id = 19, Ticker = "KNIP11", Nome = "Kinea Índices de Preços FII", Tipo = "FII", Setor = "Papel / IPCA", PrecoAtual = 91.80m, VariacaoDia = -0.10m, DividendYield = 10.80m },
        new Ativo { Id = 20, Ticker = "KNCR11", Nome = "Kinea Rendimentos Imobiliários FII", Tipo = "FII", Setor = "Papel / CDI", PrecoAtual = 104.30m, VariacaoDia = 0.05m, DividendYield = 12.60m },
        new Ativo { Id = 21, Ticker = "BTLG11", Nome = "BTG Pactual Logística FII", Tipo = "FII", Setor = "Logística / Galpões", PrecoAtual = 99.40m, VariacaoDia = 0.40m, DividendYield = 9.30m },
        new Ativo { Id = 22, Ticker = "VISC11", Nome = "Vinci Shopping Centers FII", Tipo = "FII", Setor = "Shopping Centers", PrecoAtual = 114.80m, VariacaoDia = 0.15m, DividendYield = 8.95m },
        new Ativo { Id = 23, Ticker = "HGRU11", Nome = "CSHG Renda Urbana FII", Tipo = "FII", Setor = "Renda Urbana / Educacional", PrecoAtual = 124.60m, VariacaoDia = 0.25m, DividendYield = 9.20m },
        new Ativo { Id = 24, Ticker = "CPTS11", Nome = "Capitânia Securities II FII", Tipo = "FII", Setor = "Papel / CRI", PrecoAtual = 7.95m, VariacaoDia = -0.25m, DividendYield = 11.90m },
        new Ativo { Id = 25, Ticker = "VGHF11", Nome = "Valora Hedge Fund FII", Tipo = "FII", Setor = "Hedge Fund Imobiliário", PrecoAtual = 8.45m, VariacaoDia = 0.00m, DividendYield = 12.80m },
        new Ativo { Id = 26, Ticker = "TGAR11", Nome = "TG Ativo Real FII", Tipo = "FII", Setor = "Desenvolvimento / Loteamentos", PrecoAtual = 118.50m, VariacaoDia = 0.30m, DividendYield = 13.50m },
        new Ativo { Id = 27, Ticker = "KNHY11", Nome = "Kinea High Yield FII", Tipo = "FII", Setor = "Papel / High Yield", PrecoAtual = 99.20m, VariacaoDia = 0.10m, DividendYield = 12.10m },
        new Ativo { Id = 28, Ticker = "XPLG11", Nome = "XP Log FII", Tipo = "FII", Setor = "Logística / Galpões", PrecoAtual = 102.10m, VariacaoDia = 0.18m, DividendYield = 8.70m },
        new Ativo { Id = 29, Ticker = "TRXF11", Nome = "TRX Real Estate FII", Tipo = "FII", Setor = "Renda Urbana / Imóveis Comerciais", PrecoAtual = 105.80m, VariacaoDia = 0.45m, DividendYield = 9.80m },
        new Ativo { Id = 30, Ticker = "ALZR11", Nome = "Alianza Trust Renda Imobiliária FII", Tipo = "FII", Setor = "Híbrido / Renda Urbana", PrecoAtual = 103.50m, VariacaoDia = 0.20m, DividendYield = 8.85m },
    };

    public AtivoRepository(DbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<IEnumerable<Ativo>> ObterTodosAsync()
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                SELECT id, ticker, nome, tipo, setor, preco_atual AS PrecoAtual, 
                       variacao_dia AS VariacaoDia, dividend_yield AS DividendYield, 
                       data_atualizacao AS DataAtualizacao, created_at AS CreatedAt
                FROM inv.ativos
                ORDER BY tipo, ticker;
            """;
            var result = await conn.QueryAsync<Ativo>(sql);
            if (result.Any()) return result;
        }
        catch
        {
            // Fallback resiliente
        }

        return _ativosFallback.OrderBy(a => a.Tipo).ThenBy(a => a.Ticker);
    }

    public async Task<Ativo?> ObterPorIdAsync(int id)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                SELECT id, ticker, nome, tipo, setor, preco_atual AS PrecoAtual, 
                       variacao_dia AS VariacaoDia, dividend_yield AS DividendYield, 
                       data_atualizacao AS DataAtualizacao, created_at AS CreatedAt
                FROM inv.ativos
                WHERE id = @Id;
            """;
            var result = await conn.QuerySingleOrDefaultAsync<Ativo>(sql, new { Id = id });
            if (result is not null) return result;
        }
        catch { }

        return _ativosFallback.FirstOrDefault(a => a.Id == id);
    }

    public async Task<Ativo?> ObterPorTickerAsync(string ticker)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                SELECT id, ticker, nome, tipo, setor, preco_atual AS PrecoAtual, 
                       variacao_dia AS VariacaoDia, dividend_yield AS DividendYield, 
                       data_atualizacao AS DataAtualizacao, created_at AS CreatedAt
                FROM inv.ativos
                WHERE UPPER(ticker) = UPPER(@Ticker);
            """;
            var result = await conn.QuerySingleOrDefaultAsync<Ativo>(sql, new { Ticker = ticker });
            if (result is not null) return result;
        }
        catch { }

        return _ativosFallback.FirstOrDefault(a => a.Ticker.Equals(ticker, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<int> CriarAsync(Ativo ativo)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual, variacao_dia, dividend_yield)
                VALUES (UPPER(@Ticker), @Nome, @Tipo, @Setor, @PrecoAtual, @VariacaoDia, @DividendYield)
                RETURNING id;
            """;
            return await conn.ExecuteScalarAsync<int>(sql, ativo);
        }
        catch
        {
            ativo.Id = _ativosFallback.Max(a => a.Id) + 1;
            _ativosFallback.Add(ativo);
            return ativo.Id;
        }
    }

    public async Task<bool> AtualizarCotacaoAsync(int id, decimal precoAtual, decimal? variacaoDia, decimal? dividendYield)
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            const string sql = """
                UPDATE inv.ativos
                SET preco_atual = @PrecoAtual,
                    variacao_dia = COALESCE(@VariacaoDia, variacao_dia),
                    dividend_yield = COALESCE(@DividendYield, dividend_yield),
                    data_atualizacao = CURRENT_TIMESTAMP
                WHERE id = @Id;
            """;
            var rows = await conn.ExecuteAsync(sql, new { Id = id, PrecoAtual = precoAtual, VariacaoDia = variacaoDia, DividendYield = dividendYield });
            if (rows > 0) return true;
        }
        catch { }

        var item = _ativosFallback.FirstOrDefault(a => a.Id == id);
        if (item is not null)
        {
            item.PrecoAtual = precoAtual;
            if (variacaoDia.HasValue) item.VariacaoDia = variacaoDia.Value;
            if (dividendYield.HasValue) item.DividendYield = dividendYield.Value;
            item.DataAtualizacao = DateTime.UtcNow;
            return true;
        }
        return false;
    }
}
