namespace InvestirGo.API.Application.DTOs;

public record CriarOperacaoDto(
    string? Ticker,
    int? AtivoId,
    string TipoOperacao, // 'COMPRA' ou 'VENDA'
    DateTime DataOperacao,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Taxas = 0,
    string? Observacoes = null
);

public record CriarProventoDto(
    string? Ticker,
    int? AtivoId,
    string TipoProvento, // 'Dividendo', 'JCP', 'Rendimento', 'Amortizacao'
    DateTime? DataCom,
    DateTime DataPagamento,
    decimal ValorPorCota,
    decimal QuantidadeCotas,
    decimal ValorTotal,
    string? Observacoes = null
);

public record CriarAtivoDto(
    string Ticker,
    string Nome,
    string Tipo, // 'Acao', 'FII', 'BDR', 'ETF'
    string? Setor,
    decimal PrecoAtual,
    decimal VariacaoDia = 0,
    decimal DividendYield = 0
);

public record AtualizarCotacaoDto(
    decimal PrecoAtual,
    decimal? VariacaoDia,
    decimal? DividendYield
);
