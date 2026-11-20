namespace InvestirGo.API.Domain.Entities;

public class Operacao
{
    public int Id { get; set; }
    public int AtivoId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string TipoAtivo { get; set; } = string.Empty;
    public string TipoOperacao { get; set; } = "COMPRA"; // 'COMPRA' ou 'VENDA'
    public DateTime DataOperacao { get; set; }
    public decimal Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal Taxas { get; set; }
    public string? Observacoes { get; set; }
    public decimal PrecoAtual { get; set; }
    public decimal ValorAtualTotal => Quantidade * PrecoAtual;
    public Guid? UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed record OperacaoImportacaoB3(
    int Linha,
    DateTime DataOperacao,
    string TipoOperacao,
    string Ticker,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal ValorTotal,
    string? Mercado,
    string? PrazoVencimento,
    string? Instituicao);

public sealed record ResultadoSubstituicaoOperacoes(
    int OperacoesRemovidas,
    int OperacoesImportadas,
    int AtivosCriados);
