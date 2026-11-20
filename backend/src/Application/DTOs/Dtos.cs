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
    string Tipo, // Acao/BR_STOCK_SPOT, ETF, BDR, FII, FIAGRO, OPTION, FUTURE, GOLD ou OTHER
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

public record AtualizarClasseFiscalDto(string ClasseFiscal);

public record AtualizacaoCotacoesDto(
    int TotalConsultados,
    int Atualizados,
    IReadOnlyList<string> Falhas,
    DateTimeOffset ConsultadoEm);

public record OperacaoB3PreviaItemDto(
    int Linha,
    DateTime DataOperacao,
    string TipoOperacao,
    string Ticker,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal ValorTotal,
    string? Mercado,
    string? Instituicao);

public record ImportacaoB3PreviaDto(
    string NomeArquivo,
    int TotalOperacoes,
    int TotalCompras,
    int TotalVendas,
    decimal ValorTotal,
    DateTime DataInicial,
    DateTime DataFinal,
    int OperacoesExistentes,
    IReadOnlyList<string> AtivosNovos,
    IReadOnlyList<OperacaoB3PreviaItemDto> Operacoes,
    int LinhasOmitidas);

public record ImportacaoB3ResultadoDto(
    int OperacoesRemovidas,
    int OperacoesImportadas,
    int AtivosCriados);

public record MercadoPontoDto(
    DateTimeOffset Data,
    decimal Valor);

public record MercadoIndicadorDto(
    string Codigo,
    string Nome,
    string Unidade,
    decimal Valor,
    decimal VariacaoPercentual,
    decimal Minima,
    decimal Maxima,
    DateTimeOffset AtualizadoEm,
    string Fonte,
    IReadOnlyList<MercadoPontoDto> Historico);

public record MercadoPainelDto(
    MercadoIndicadorDto? Ibovespa,
    MercadoIndicadorDto? Dolar,
    DateTimeOffset ConsultadoEm,
    IReadOnlyList<string> Avisos);

// DTOs para Histórico (até 5 anos com gráfico)
public record HistoricoPontoDto(
    string Data,
    decimal Preco,
    decimal VariacaoPeriodo,
    string DataCompleta
);

public record HistoricoAtivoDto(
    string Ticker,
    string Nome,
    string Periodo,
    decimal PrecoInicial,
    decimal PrecoFinal,
    decimal VariacaoReais,
    decimal VariacaoPercentual,
    decimal Minima,
    decimal Maxima,
    decimal PrecoMedio,
    IEnumerable<HistoricoPontoDto> Pontos
);

// DTOs para Performance (Top 7 Altas e Baixas)
public record PerformanceAtivoDto(
    int Posicao,
    string Ticker,
    string Nome,
    string Tipo,
    string? Setor,
    decimal PrecoAtual,
    decimal PrecoInicial,
    decimal VariacaoPercentual,
    decimal VariacaoReais,
    bool IsAlta
);

// DTOs para Notícias e Favoritos
public record NoticiaAtivoDto(
    string Id,
    string Ticker,
    IEnumerable<string>? TickersRelacionados,
    string Titulo,
    string Resumo,
    string Fonte,
    string DataPublicacao,
    string Categoria,
    string Sentimento
);
