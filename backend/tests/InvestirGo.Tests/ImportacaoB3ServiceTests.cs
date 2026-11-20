using ClosedXML.Excel;
using InvestirGo.API.Infrastructure.Services;
using Microsoft.AspNetCore.Http;

namespace InvestirGo.Tests;

public class ImportacaoB3ServiceTests
{
    [Fact]
    public async Task LerOperacoesAsync_LeModeloB3ComValoresNumericos()
    {
        await using var stream = new MemoryStream();
        using (var workbook = new XLWorkbook())
        {
            var planilha = workbook.AddWorksheet("Negociação");
            planilha.Cell(1, 1).Value = "Data do Negócio";
            planilha.Cell(1, 2).Value = "Tipo de Movimentação";
            planilha.Cell(1, 3).Value = "Mercado";
            planilha.Cell(1, 4).Value = "Prazo/Vencimento";
            planilha.Cell(1, 5).Value = "Instituição";
            planilha.Cell(1, 6).Value = "Código de Negociação";
            planilha.Cell(1, 7).Value = "Quantidade";
            planilha.Cell(1, 8).Value = "Preço";
            planilha.Cell(1, 9).Value = "Valor da Operação";

            planilha.Cell(2, 1).Value = new DateTime(2026, 11, 19);
            planilha.Cell(2, 2).Value = "Compra";
            planilha.Cell(2, 3).Value = "Mercado à Vista";
            planilha.Cell(2, 4).Value = "-";
            planilha.Cell(2, 5).Value = "Corretora Teste";
            planilha.Cell(2, 6).Value = "BBDC4";
            planilha.Cell(2, 7).Value = 1000;
            planilha.Cell(2, 8).Value = 13.84;
            planilha.Cell(2, 9).Value = 13840;
            workbook.SaveAs(stream);
        }
        stream.Position = 0;
        var arquivo = new FormFile(stream, 0, stream.Length, "arquivo", "negociacoes.xlsx");

        var operacoes = await ImportacaoB3Service.LerOperacoesAsync(arquivo, CancellationToken.None);

        var operacao = Assert.Single(operacoes);
        Assert.Equal(new DateTime(2026, 11, 19), operacao.DataOperacao);
        Assert.Equal("COMPRA", operacao.TipoOperacao);
        Assert.Equal("BBDC4", operacao.Ticker);
        Assert.Equal(1000m, operacao.Quantidade);
        Assert.Equal(13.84m, operacao.PrecoUnitario);
        Assert.Equal(13840m, operacao.ValorTotal);
        Assert.Equal("Mercado à Vista", operacao.Mercado);
        Assert.Equal("Corretora Teste", operacao.Instituicao);
    }

    [Fact]
    public async Task LerOperacoesAsync_RejeitaArquivoQueNaoSejaXlsx()
    {
        await using var stream = new MemoryStream("Data,Tipo"u8.ToArray());
        var arquivo = new FormFile(stream, 0, stream.Length, "arquivo", "negociacoes.csv");

        var erro = await Assert.ThrowsAsync<ImportacaoB3Exception>(() =>
            ImportacaoB3Service.LerOperacoesAsync(arquivo, CancellationToken.None));

        Assert.Contains("apenas uma planilha Excel .xlsx", erro.Message);
    }
}
