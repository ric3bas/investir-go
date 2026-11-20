using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using InvestirGo.API.Application.DTOs;
using InvestirGo.API.Application.Interfaces;
using InvestirGo.API.Domain.Entities;

namespace InvestirGo.API.Infrastructure.Services;

public sealed partial class ImportacaoB3Service(
    IOperacaoRepository operacaoRepository,
    IAtivoRepository ativoRepository)
{
    public const long TamanhoMaximoArquivo = 10 * 1024 * 1024;
    private const int MaximoOperacoes = 20_000;
    private const int MaximoItensPrevia = 100;
    private const long TamanhoMaximoDescompactado = 100 * 1024 * 1024;

    private static readonly CultureInfo CulturaBrasil = CultureInfo.GetCultureInfo("pt-BR");

    public async Task<ImportacaoB3PreviaDto> GerarPreviaAsync(
        IFormFile arquivo,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var operacoes = await LerOperacoesAsync(arquivo, cancellationToken);
        var ativosCadastrados = (await ativoRepository.ObterTodosAsync())
            .Select(ativo => ativo.Ticker)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var ativosNovos = operacoes
            .Select(item => item.Ticker)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(ticker => !ativosCadastrados.Contains(ticker))
            .OrderBy(ticker => ticker)
            .ToArray();
        var operacoesExistentes = await operacaoRepository.ContarPorUsuarioAsync(userId);

        var itens = operacoes
            .Take(MaximoItensPrevia)
            .Select(item => new OperacaoB3PreviaItemDto(
                item.Linha,
                item.DataOperacao,
                item.TipoOperacao,
                item.Ticker,
                item.Quantidade,
                item.PrecoUnitario,
                item.ValorTotal,
                item.Mercado,
                item.Instituicao))
            .ToArray();

        return new ImportacaoB3PreviaDto(
            Path.GetFileName(arquivo.FileName),
            operacoes.Count,
            operacoes.Count(item => item.TipoOperacao == "COMPRA"),
            operacoes.Count(item => item.TipoOperacao == "VENDA"),
            operacoes.Sum(item => item.ValorTotal),
            operacoes.Min(item => item.DataOperacao),
            operacoes.Max(item => item.DataOperacao),
            operacoesExistentes,
            ativosNovos,
            itens,
            operacoes.Count - itens.Length);
    }

    public async Task<ImportacaoB3ResultadoDto> ImportarAsync(
        IFormFile arquivo,
        Guid userId,
        CancellationToken cancellationToken)
    {
        // O arquivo é obrigatoriamente relido e revalidado após a confirmação.
        // Assim, nenhuma linha enviada pelo navegador na prévia é considerada confiável.
        var operacoes = await LerOperacoesAsync(arquivo, cancellationToken);
        var resultado = await operacaoRepository.SubstituirPorImportacaoB3Async(userId, operacoes);
        return new ImportacaoB3ResultadoDto(
            resultado.OperacoesRemovidas,
            resultado.OperacoesImportadas,
            resultado.AtivosCriados);
    }

    internal static async Task<IReadOnlyList<OperacaoImportacaoB3>> LerOperacoesAsync(
        IFormFile arquivo,
        CancellationToken cancellationToken)
    {
        ValidarArquivo(arquivo);

        await using var memoria = new MemoryStream((int)arquivo.Length);
        await arquivo.CopyToAsync(memoria, cancellationToken);
        memoria.Position = 0;

        if (memoria.Length < 4 || memoria.ReadByte() != 'P' || memoria.ReadByte() != 'K')
            throw new ImportacaoB3Exception("O arquivo não é uma planilha Excel .xlsx válida.");
        memoria.Position = 0;
        ValidarConteudoXlsx(memoria);
        memoria.Position = 0;

        try
        {
            using var workbook = new XLWorkbook(memoria);
            var worksheet = workbook.Worksheets.FirstOrDefault()
                ?? throw new ImportacaoB3Exception("A planilha não possui nenhuma aba.");
            return LerWorksheet(worksheet);
        }
        catch (ImportacaoB3Exception)
        {
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new ImportacaoB3Exception(
                "Não foi possível abrir a planilha. Exporte novamente o arquivo de negociações no portal da B3.");
        }
    }

    private static IReadOnlyList<OperacaoImportacaoB3> LerWorksheet(IXLWorksheet worksheet)
    {
        var ultimaLinhaUsada = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        var ultimaColunaUsada = worksheet.LastColumnUsed()?.ColumnNumber() ?? 0;
        if (ultimaLinhaUsada == 0 || ultimaColunaUsada == 0)
            throw new ImportacaoB3Exception("A planilha está vazia.");

        var cabecalho = LocalizarCabecalho(worksheet, ultimaLinhaUsada, ultimaColunaUsada);
        if (ultimaLinhaUsada - cabecalho.Linha > MaximoOperacoes)
            throw new ImportacaoB3Exception($"A planilha excede o limite de {MaximoOperacoes:N0} operações.");

        var operacoes = new List<OperacaoImportacaoB3>();
        var erros = new List<string>();

        for (var numeroLinha = cabecalho.Linha + 1; numeroLinha <= ultimaLinhaUsada; numeroLinha++)
        {
            var linha = worksheet.Row(numeroLinha);
            if (LinhaEstaVazia(linha, cabecalho)) continue;

            try
            {
                var data = LerData(linha.Cell(cabecalho.Data), numeroLinha);
                var tipo = NormalizarTipo(LerTexto(linha.Cell(cabecalho.Tipo)), numeroLinha);
                var ticker = NormalizarTicker(LerTexto(linha.Cell(cabecalho.Ticker)), numeroLinha);
                var quantidade = LerDecimal(linha.Cell(cabecalho.Quantidade), "Quantidade", numeroLinha);
                var preco = LerDecimal(linha.Cell(cabecalho.Preco), "Preço", numeroLinha);
                if (quantidade <= 0) throw new ImportacaoB3Exception($"Linha {numeroLinha}: a quantidade deve ser maior que zero.");
                if (preco <= 0) throw new ImportacaoB3Exception($"Linha {numeroLinha}: o preço deve ser maior que zero.");

                var valorTotal = cabecalho.ValorTotal.HasValue && !linha.Cell(cabecalho.ValorTotal.Value).IsEmpty()
                    ? LerDecimal(linha.Cell(cabecalho.ValorTotal.Value), "Valor da Operação", numeroLinha)
                    : quantidade * preco;
                if (valorTotal <= 0)
                    throw new ImportacaoB3Exception($"Linha {numeroLinha}: o valor da operação deve ser maior que zero.");

                operacoes.Add(new OperacaoImportacaoB3(
                    numeroLinha,
                    data.Date,
                    tipo,
                    ticker,
                    quantidade,
                    preco,
                    valorTotal,
                    LerTextoOpcional(linha, cabecalho.Mercado),
                    LerTextoOpcional(linha, cabecalho.PrazoVencimento),
                    LerTextoOpcional(linha, cabecalho.Instituicao)));
            }
            catch (ImportacaoB3Exception ex)
            {
                if (erros.Count < 20) erros.Add(ex.Message);
            }
        }

        if (erros.Count > 0)
        {
            var sufixo = erros.Count == 20 ? " Outros erros podem existir." : string.Empty;
            throw new ImportacaoB3Exception($"Corrija a planilha antes de importar: {string.Join(" ", erros)}{sufixo}");
        }
        if (operacoes.Count == 0)
            throw new ImportacaoB3Exception("Nenhuma compra ou venda foi encontrada na planilha.");

        return operacoes;
    }

    private static CabecalhoB3 LocalizarCabecalho(IXLWorksheet worksheet, int ultimaLinha, int ultimaColuna)
    {
        var limiteLinhas = Math.Min(ultimaLinha, 10);
        var limiteColunas = Math.Min(ultimaColuna, 50);

        for (var linha = 1; linha <= limiteLinhas; linha++)
        {
            var colunas = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (var coluna = 1; coluna <= limiteColunas; coluna++)
            {
                var nome = NormalizarCabecalho(worksheet.Cell(linha, coluna).GetString());
                if (!string.IsNullOrEmpty(nome)) colunas.TryAdd(nome, coluna);
            }

            var data = BuscarColuna(colunas, "data do negocio", "data negocio");
            var tipo = BuscarColuna(colunas, "tipo de movimentacao", "tipo movimentacao");
            var ticker = BuscarColuna(colunas, "codigo de negociacao", "codigo negociacao");
            var quantidade = BuscarColuna(colunas, "quantidade");
            var preco = BuscarColuna(colunas, "preco", "preco unitario");
            if (data.HasValue && tipo.HasValue && ticker.HasValue && quantidade.HasValue && preco.HasValue)
            {
                return new CabecalhoB3(
                    linha,
                    data.Value,
                    tipo.Value,
                    ticker.Value,
                    quantidade.Value,
                    preco.Value,
                    BuscarColuna(colunas, "valor da operacao", "valor operacao", "valor total"),
                    BuscarColuna(colunas, "mercado"),
                    BuscarColuna(colunas, "prazo vencimento", "prazo", "vencimento"),
                    BuscarColuna(colunas, "instituicao"));
            }
        }

        throw new ImportacaoB3Exception(
            "Modelo da B3 não reconhecido. São obrigatórias as colunas Data do Negócio, Tipo de Movimentação, Código de Negociação, Quantidade e Preço.");
    }

    private static bool LinhaEstaVazia(IXLRow linha, CabecalhoB3 cabecalho) =>
        linha.Cell(cabecalho.Data).IsEmpty() &&
        linha.Cell(cabecalho.Tipo).IsEmpty() &&
        linha.Cell(cabecalho.Ticker).IsEmpty() &&
        linha.Cell(cabecalho.Quantidade).IsEmpty() &&
        linha.Cell(cabecalho.Preco).IsEmpty();

    private static DateTime LerData(IXLCell cell, int linha)
    {
        if (cell.DataType == XLDataType.DateTime) return cell.GetDateTime();
        if (cell.DataType == XLDataType.Number)
        {
            try { return DateTime.FromOADate(cell.GetDouble()); }
            catch (ArgumentException) { }
        }

        var texto = LerTexto(cell);
        var formatos = new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "dd-MM-yyyy" };
        if (DateTime.TryParseExact(texto, formatos, CulturaBrasil, DateTimeStyles.None, out var data))
            return data;
        throw new ImportacaoB3Exception($"Linha {linha}: Data do Negócio inválida.");
    }

    private static decimal LerDecimal(IXLCell cell, string coluna, int linha)
    {
        if (cell.DataType == XLDataType.Number)
            return Convert.ToDecimal(cell.GetDouble(), CultureInfo.InvariantCulture);

        var texto = LerTexto(cell)
            .Replace("R$", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("\u00a0", string.Empty)
            .Trim();
        if (decimal.TryParse(texto, NumberStyles.Number | NumberStyles.AllowCurrencySymbol, CulturaBrasil, out var valor) ||
            decimal.TryParse(texto, NumberStyles.Number | NumberStyles.AllowCurrencySymbol, CultureInfo.InvariantCulture, out valor))
            return valor;
        throw new ImportacaoB3Exception($"Linha {linha}: {coluna} inválido(a).");
    }

    private static string NormalizarTipo(string valor, int linha)
    {
        var tipo = NormalizarCabecalho(valor);
        return tipo switch
        {
            "compra" => "COMPRA",
            "venda" => "VENDA",
            _ => throw new ImportacaoB3Exception($"Linha {linha}: Tipo de Movimentação deve ser Compra ou Venda.")
        };
    }

    private static string NormalizarTicker(string valor, int linha)
    {
        var ticker = valor.Trim().Replace(" ", string.Empty).ToUpperInvariant();
        if (!TickerRegex().IsMatch(ticker))
            throw new ImportacaoB3Exception($"Linha {linha}: Código de Negociação inválido.");
        return ticker;
    }

    private static string LerTexto(IXLCell cell) => cell.GetString().Trim();

    private static string? LerTextoOpcional(IXLRow linha, int? coluna)
    {
        if (!coluna.HasValue) return null;
        var valor = LerTexto(linha.Cell(coluna.Value));
        return string.IsNullOrWhiteSpace(valor) ? null : valor;
    }

    private static int? BuscarColuna(IReadOnlyDictionary<string, int> colunas, params string[] nomes)
    {
        foreach (var nome in nomes)
            if (colunas.TryGetValue(nome, out var coluna)) return coluna;
        return null;
    }

    private static string NormalizarCabecalho(string valor)
    {
        var decomposto = valor.Trim().Normalize(NormalizationForm.FormD);
        var semAcentos = new string(decomposto
            .Where(caractere => CharUnicodeInfo.GetUnicodeCategory(caractere) != UnicodeCategory.NonSpacingMark)
            .ToArray());
        return SeparadoresRegex().Replace(semAcentos.ToLowerInvariant(), " ").Trim();
    }

    private static void ValidarArquivo(IFormFile arquivo)
    {
        if (arquivo.Length == 0) throw new ImportacaoB3Exception("Selecione uma planilha Excel preenchida.");
        if (arquivo.Length > TamanhoMaximoArquivo)
            throw new ImportacaoB3Exception("A planilha deve ter no máximo 10 MB.");
        if (!string.Equals(Path.GetExtension(arquivo.FileName), ".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new ImportacaoB3Exception("Formato não permitido. Envie apenas uma planilha Excel .xlsx.");
    }

    private static void ValidarConteudoXlsx(Stream stream)
    {
        try
        {
            using var pacote = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
            if (pacote.Entries.Count > 2_000 || pacote.Entries.Sum(item => item.Length) > TamanhoMaximoDescompactado)
                throw new ImportacaoB3Exception("A planilha é grande ou complexa demais para importação.");

            var nomes = pacote.Entries.Select(item => item.FullName).ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (!nomes.Contains("[Content_Types].xml") || !nomes.Contains("xl/workbook.xml"))
                throw new ImportacaoB3Exception("O arquivo não é uma planilha Excel .xlsx válida.");
        }
        catch (ImportacaoB3Exception)
        {
            throw;
        }
        catch (InvalidDataException)
        {
            throw new ImportacaoB3Exception("O arquivo não é uma planilha Excel .xlsx válida.");
        }
    }

    [GeneratedRegex("^[A-Z0-9]{4,12}$", RegexOptions.CultureInvariant)]
    private static partial Regex TickerRegex();

    [GeneratedRegex("[^a-zA-Z0-9]+", RegexOptions.CultureInvariant)]
    private static partial Regex SeparadoresRegex();

    private sealed record CabecalhoB3(
        int Linha,
        int Data,
        int Tipo,
        int Ticker,
        int Quantidade,
        int Preco,
        int? ValorTotal,
        int? Mercado,
        int? PrazoVencimento,
        int? Instituicao);
}

public sealed class ImportacaoB3Exception(string message) : Exception(message);
