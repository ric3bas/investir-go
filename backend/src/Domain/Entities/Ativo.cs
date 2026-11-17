namespace InvestirGo.API.Domain.Entities;

public class Ativo
{
    public int Id { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Acao"; // 'Acao', 'FII', 'BDR', 'ETF'
    public string? Setor { get; set; }
    public decimal PrecoAtual { get; set; }
    public decimal VariacaoDia { get; set; }
    public decimal DividendYield { get; set; }
    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
