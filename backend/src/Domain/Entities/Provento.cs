namespace InvestirGo.API.Domain.Entities;

public class Provento
{
    public int Id { get; set; }
    public int AtivoId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string NomeAtivo { get; set; } = string.Empty;
    public string TipoProvento { get; set; } = "Dividendo"; // 'Dividendo', 'JCP', 'Rendimento', 'Amortizacao'
    public DateTime? DataCom { get; set; }
    public DateTime DataPagamento { get; set; }
    public decimal ValorPorCota { get; set; }
    public decimal QuantidadeCotas { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Observacoes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
