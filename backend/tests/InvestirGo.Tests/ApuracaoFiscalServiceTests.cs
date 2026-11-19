using InvestirGo.API.Domain.Entities;
using InvestirGo.API.Infrastructure.Services;

namespace InvestirGo.Tests;

public sealed class ApuracaoFiscalServiceTests
{
    private static readonly Guid Usuario = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task VendasDeAcoesAteVinteMilComLucroSaoIsentas()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 5), 1_000, 18m),
            Op(2, "VENDA", new DateTime(2026, 2, 5), 1_000, 20m));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.True(fevereiro.AcoesIsentas);
        Assert.Equal(2_000m, fevereiro.ResultadoIsentoAcoes);
        Assert.Equal(0m, fevereiro.ImpostoBruto);
        Assert.Equal(0m, fevereiro.DarfEstimado);
    }

    [Fact]
    public async Task UmCentavoAcimaDoLimiteTornaLucroTributavel()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 5), 1_000, 18.00001m),
            Op(2, "VENDA", new DateTime(2026, 2, 5), 1_000, 20.00001m));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.False(fevereiro.AcoesIsentas);
        Assert.Equal(2_000m, fevereiro.BaseTributavelComum);
        Assert.Equal(300m, fevereiro.ImpostoBruto);
    }

    [Fact]
    public async Task LucroIsentoNaoConsomePrejuizoAnterior()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 100, 108m),
            Op(2, "VENDA", new DateTime(2026, 2, 2), 100, 100m),
            Op(3, "COMPRA", new DateTime(2026, 3, 2), 100, 140m),
            Op(4, "VENDA", new DateTime(2026, 4, 2), 100, 150m));

        var abril = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 4);

        Assert.Equal(1_000m, abril.ResultadoIsentoAcoes);
        Assert.Equal(800m, abril.SaldoPrejuizoComum);
    }

    [Fact]
    public async Task PrejuizoAnteriorReduzBaseDeLucroTributavel()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 100, 108m),
            Op(2, "VENDA", new DateTime(2026, 2, 2), 100, 100m),
            Op(3, "COMPRA", new DateTime(2026, 3, 2), 1_000, 23m),
            Op(4, "VENDA", new DateTime(2026, 4, 2), 1_000, 25m));

        var abril = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 4);

        Assert.Equal(800m, abril.PrejuizoCompensadoComum);
        Assert.Equal(1_200m, abril.BaseTributavelComum);
        Assert.Equal(180m, abril.ImpostoBruto);
    }

    [Fact]
    public async Task DayTradeTemAliquotaDeVintePorCentoIndependenteDoVolume()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 5, 4), 100, 10m),
            Op(2, "VENDA", new DateTime(2026, 5, 4), 100, 15m));

        var maio = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 5);

        Assert.Equal(500m, maio.ResultadoDayTrade);
        Assert.Equal(500m, maio.BaseTributavelDayTrade);
        Assert.Equal(100m, maio.ImpostoBruto);
    }

    [Fact]
    public async Task FiiNaoUsaIsencaoDeVinteMil()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 100, 90m, "FII", "HGLG11"),
            Op(2, "VENDA", new DateTime(2026, 2, 2), 100, 100m, "FII", "HGLG11"));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.Equal(1_000m, fevereiro.BaseTributavelFiis);
        Assert.Equal(200m, fevereiro.ImpostoBruto);
    }

    [Fact]
    public async Task VendasDeAtivosDiferentesSaoSomadasParaTestarIsencao()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 1_000, 11m, ticker: "AAAA3"),
            Op(2, "COMPRA", new DateTime(2026, 1, 3), 1_000, 9m, ticker: "BBBB3"),
            Op(1, "VENDA", new DateTime(2026, 2, 2), 1_000, 12m, ticker: "AAAA3"),
            Op(2, "VENDA", new DateTime(2026, 2, 3), 1_000, 10m, ticker: "BBBB3"));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.Equal(22_000m, fevereiro.VendasAcoes);
        Assert.False(fevereiro.AcoesIsentas);
        Assert.Equal(2_000m, fevereiro.BaseTributavelComum);
    }

    [Fact]
    public async Task IrrfEstimadoDeCincoReaisReduzDarfDeTrezentosParaDuzentosENoventaECinco()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 1_000, 98m),
            Op(2, "VENDA", new DateTime(2026, 2, 2), 1_000, 100m));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.Equal(5m, fevereiro.IrrfComumEstimado);
        Assert.Equal(300m, fevereiro.ImpostoBruto);
        Assert.Equal(295m, fevereiro.DarfEstimado);
    }

    [Fact]
    public async Task ApuracaoNaoMisturaOperacoesDeOutroUsuario()
    {
        var repo = new TestOperacaoRepository();
        await repo.CriarAsync(Op(1, "COMPRA", new DateTime(2026, 1, 2), 1_000, 98m));
        var vendaDeOutroUsuario = Op(2, "VENDA", new DateTime(2026, 2, 2), 1_000, 100m);
        vendaDeOutroUsuario.UserId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        await repo.CriarAsync(vendaDeOutroUsuario);

        var fevereiro = (await new ApuracaoFiscalService(repo).CalcularAsync(Usuario, 2026))
            .Meses.Single(m => m.Mes == 2);

        Assert.Equal(0m, fevereiro.VendasAcoes);
        Assert.Equal(0m, fevereiro.DarfEstimado);
    }

    [Theory]
    [InlineData("ETF", "BOVA11")]
    [InlineData("BDR", "AAPL34")]
    [InlineData("OPTION", "PETRA100")]
    [InlineData("FUTURE", "WINZ26")]
    public async Task ClassesDoGrupoGeralNaoRecebemIsencaoDeVinteMil(string tipoAtivo, string ticker)
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 100, 90m, tipoAtivo, ticker),
            Op(2, "VENDA", new DateTime(2026, 2, 2), 100, 100m, tipoAtivo, ticker));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.Equal(1_000m, fevereiro.BaseTributavelComum);
        Assert.Equal(150m, fevereiro.ImpostoBruto);
    }

    [Fact]
    public async Task AcoesEOuroUsamLimitesDeIsencaoSeparados()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 1_000, 18m, "Acao", "PETR4"),
            Op(2, "COMPRA", new DateTime(2026, 1, 3), 100, 190m, "GOLD", "OURO"),
            Op(1, "VENDA", new DateTime(2026, 2, 2), 1_000, 20m, "Acao", "PETR4"),
            Op(2, "VENDA", new DateTime(2026, 2, 3), 100, 200m, "GOLD", "OURO"));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.True(fevereiro.AcoesIsentas);
        Assert.True(fevereiro.OuroIsento);
        Assert.Equal(2_000m, fevereiro.ResultadoIsentoAcoes);
        Assert.Equal(1_000m, fevereiro.ResultadoIsentoOuro);
        Assert.Equal(0m, fevereiro.BaseTributavelComum);
    }

    [Fact]
    public async Task FiiEFiagroCompartilhamMesmoGrupoDePrejuizo()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 100, 100m, "FII", "HGLG11"),
            Op(1, "VENDA", new DateTime(2026, 2, 2), 100, 90m, "FII", "HGLG11"),
            Op(2, "COMPRA", new DateTime(2026, 3, 2), 100, 85m, "FIAGRO", "KNCA11"),
            Op(2, "VENDA", new DateTime(2026, 4, 2), 100, 100m, "FIAGRO", "KNCA11"));

        var abril = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 4);

        Assert.Equal(1_000m, abril.PrejuizoCompensadoFiis);
        Assert.Equal(500m, abril.BaseTributavelFiis);
        Assert.Equal(100m, abril.ImpostoBruto);
    }

    [Fact]
    public async Task PrejuizoDayTradeDeFiiCompensaGanhoComumDeFiagro()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 2, 2), 100, 100m, "FII", "HGLG11"),
            Op(1, "VENDA", new DateTime(2026, 2, 2), 100, 90m, "FII", "HGLG11"),
            Op(2, "COMPRA", new DateTime(2026, 3, 2), 100, 90m, "FIAGRO", "KNCA11"),
            Op(2, "VENDA", new DateTime(2026, 4, 2), 100, 100m, "FIAGRO", "KNCA11"));

        var abril = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 4);

        Assert.Equal(1_000m, abril.PrejuizoCompensadoFiis);
        Assert.Equal(0m, abril.BaseTributavelFiis);
        Assert.Equal(0m, abril.SaldoPrejuizoFiis);
    }

    [Fact]
    public async Task IrrfDayTradeDeFiiTambemReduzImpostoDoGrupoFiiFiagro()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 2, 2), 100, 10m, "FII", "HGLG11"),
            Op(1, "VENDA", new DateTime(2026, 2, 2), 100, 15m, "FII", "HGLG11"));

        var fevereiro = (await service.CalcularAsync(Usuario, 2026)).Meses.Single(m => m.Mes == 2);

        Assert.Equal(500m, fevereiro.BaseTributavelFiis);
        Assert.Equal(100m, fevereiro.ImpostoBruto);
        Assert.Equal(5m, fevereiro.IrrfDayTradeEstimado);
        Assert.Equal(95m, fevereiro.DarfEstimado);
    }

    [Fact]
    public async Task ClasseOtherApareceParaRevisaoMasNaoEntraNoDarf()
    {
        var service = await CriarServiceAsync(
            Op(1, "COMPRA", new DateTime(2026, 1, 2), 100, 10m, "OTHER", "XPTO"),
            Op(1, "VENDA", new DateTime(2026, 2, 2), 100, 20m, "OTHER", "XPTO"));

        var apuracao = await service.CalcularAsync(Usuario, 2026);
        var fevereiro = apuracao.Meses.Single(m => m.Mes == 2);

        Assert.Equal(0m, fevereiro.ImpostoBruto);
        Assert.Equal(0m, fevereiro.DarfEstimado);
        Assert.False(fevereiro.Ativos.Single().Calculado);
        Assert.Contains(apuracao.Alertas, alerta => alerta.Contains("OTHER"));
    }

    [Fact]
    public async Task RespostaExpoeTodasAsClassesDaMatrizFiscal()
    {
        var apuracao = await (await CriarServiceAsync()).CalcularAsync(Usuario, 2026);

        Assert.Equal(9, apuracao.MatrizFiscal.Count);
        Assert.Contains(apuracao.MatrizFiscal, item => item.Codigo == "BR_STOCK_SPOT" && item.AliquotaComum == 15m);
        Assert.Contains(apuracao.MatrizFiscal, item => item.Codigo == "FIAGRO" && item.GrupoPrejuizo == "Grupo FII/Fiagro");
        Assert.Contains(apuracao.MatrizFiscal, item => item.Codigo == "OTHER" && !item.Calculavel);
    }

    [Fact]
    public async Task LancamentosMalformadosGeramAvisosSemDerrubarTodaApuracao()
    {
        var repo = new TestOperacaoRepository();
        await repo.CriarAsync(new Operacao
        {
            UserId = Usuario,
            Ticker = null!,
            TipoAtivo = "Acao",
            TipoOperacao = "COMPRA",
            DataOperacao = new DateTime(2026, 1, 2),
            Quantidade = 10,
            PrecoUnitario = 10
        });
        await repo.CriarAsync(new Operacao
        {
            UserId = Usuario,
            Ticker = "ERRO3",
            TipoAtivo = "Acao",
            TipoOperacao = null!,
            DataOperacao = DateTime.MinValue,
            Quantidade = 10,
            PrecoUnitario = 10
        });
        await repo.CriarAsync(new Operacao
        {
            AtivoId = 2,
            UserId = Usuario,
            Ticker = "ERRO4",
            TipoAtivo = "Acao",
            TipoOperacao = "COMPRA",
            DataOperacao = new DateTime(2026, 1, 3),
            Quantidade = decimal.MaxValue,
            PrecoUnitario = 2m,
            ValorTotal = 0
        });

        var apuracao = await new ApuracaoFiscalService(repo).CalcularAsync(Usuario, 2026);

        Assert.Equal(12, apuracao.Meses.Count);
        Assert.Contains(apuracao.Alertas, alerta => alerta.Contains("sem ticker"));
        Assert.Contains(apuracao.Alertas, alerta => alerta.Contains("data inválida"));
        Assert.Contains(apuracao.Alertas, alerta => alerta.Contains("excedem o limite"));
    }

    private static async Task<ApuracaoFiscalService> CriarServiceAsync(params Operacao[] operacoes)
    {
        var repo = new TestOperacaoRepository();
        foreach (var operacao in operacoes)
            await repo.CriarAsync(operacao);
        return new ApuracaoFiscalService(repo);
    }

    private static Operacao Op(
        int ativoId,
        string tipo,
        DateTime data,
        decimal quantidade,
        decimal preco,
        string tipoAtivo = "Acao",
        string ticker = "TEST3") => new()
        {
            AtivoId = ativoId,
            UserId = Usuario,
            Ticker = ticker,
            NomeAtivo = ticker,
            TipoAtivo = tipoAtivo,
            TipoOperacao = tipo,
            DataOperacao = data,
            Quantidade = quantidade,
            PrecoUnitario = preco,
            ValorTotal = quantidade * preco
        };
}
