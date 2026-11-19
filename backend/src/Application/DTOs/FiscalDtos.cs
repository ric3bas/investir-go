namespace InvestirGo.API.Application.DTOs;

public sealed record ApuracaoFiscalResponseDto(
    int Ano,
    DateTime GeradoEm,
    string CodigoDarf,
    string Escopo,
    IReadOnlyList<MatrizFiscalClasseDto> MatrizFiscal,
    IReadOnlyList<ApuracaoFiscalMensalDto> Meses,
    IReadOnlyList<string> Alertas
);

public sealed record MatrizFiscalClasseDto(
    string Codigo,
    string Rotulo,
    decimal? AliquotaComum,
    decimal? AliquotaDayTrade,
    string Isencao,
    string GrupoPrejuizo,
    bool Calculavel
);

public sealed record ApuracaoFiscalMensalDto(
    int Ano,
    int Mes,
    string Competencia,
    DateTime VencimentoEstimado,
    decimal VendasAcoes,
    decimal VendasOuro,
    decimal VendasOutros,
    decimal VendasFiis,
    decimal VendasDayTrade,
    decimal ResultadoAcoes,
    decimal ResultadoIsentoAcoes,
    decimal ResultadoOuro,
    decimal ResultadoIsentoOuro,
    decimal ResultadoOutros,
    decimal ResultadoFiis,
    decimal ResultadoDayTrade,
    decimal BaseTributavelComum,
    decimal BaseTributavelFiis,
    decimal BaseTributavelDayTrade,
    decimal PrejuizoCompensadoComum,
    decimal PrejuizoCompensadoFiis,
    decimal PrejuizoCompensadoDayTrade,
    decimal SaldoPrejuizoComum,
    decimal SaldoPrejuizoFiis,
    decimal SaldoPrejuizoDayTrade,
    decimal IrrfComumEstimado,
    decimal IrrfDayTradeEstimado,
    decimal IrrfCompensado,
    decimal ImpostoBruto,
    decimal ImpostoLiquido,
    decimal SaldoMesesAnteriores,
    decimal DarfEstimado,
    decimal SaldoAbaixoMinimo,
    bool AcoesIsentas,
    bool OuroIsento,
    bool DarfDevido,
    string Situacao,
    IReadOnlyList<ApuracaoFiscalClasseMensalDto> Classes,
    IReadOnlyList<ApuracaoFiscalAtivoDto> Ativos
);

public sealed record ApuracaoFiscalClasseMensalDto(
    string Codigo,
    decimal VendasComuns,
    decimal VendasDayTrade,
    decimal ResultadoComum,
    decimal ResultadoDayTrade,
    bool Calculado
);

public sealed record ApuracaoFiscalAtivoDto(
    int AtivoId,
    string Ticker,
    string TipoAtivo,
    string ClasseFiscal,
    bool Calculado,
    decimal QuantidadeVendida,
    decimal TotalVendas,
    decimal ResultadoComum,
    decimal ResultadoDayTrade
);
