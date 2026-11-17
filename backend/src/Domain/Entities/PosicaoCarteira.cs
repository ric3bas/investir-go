namespace InvestirGo.API.Domain.Entities;

public class PosicaoCarteira
{
    public int AtivoId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string? Setor { get; set; }
    
    // Custódia e Preço Médio
    public decimal QuantidadeCustodia { get; set; }
    public decimal PrecoMedio { get; set; }
    public decimal PrecoAtual { get; set; }
    
    // Valores
    public decimal TotalInvestido => QuantidadeCustodia * PrecoMedio;
    public decimal SaldoAtual => QuantidadeCustodia * PrecoAtual;
    
    // Rendimento Não Realizado (Variação da posição em custódia)
    public decimal VariacaoReais => SaldoAtual - TotalInvestido;
    public decimal RentabilidadePercentual => TotalInvestido > 0 
        ? ((SaldoAtual - TotalInvestido) / TotalInvestido) * 100 
        : 0;

    // Proventos e Lucro Realizado
    public decimal TotalProventosRecebidos { get; set; }
    public decimal LucroRealizadoVendas { get; set; }
    public decimal LucroTotalGeral => VariacaoReais + TotalProventosRecebidos + LucroRealizadoVendas;

    // Peso na carteira
    public decimal PercentualCarteira { get; set; }
}

public class ResumoCarteira
{
    public decimal TotalInvestido { get; set; }
    public decimal SaldoAtual { get; set; }
    public decimal LucroPrejuizoNaoRealizado => SaldoAtual - TotalInvestido;
    public decimal RentabilidadePercentual => TotalInvestido > 0 
        ? ((SaldoAtual - TotalInvestido) / TotalInvestido) * 100 
        : 0;
    public decimal TotalProventos { get; set; }
    public decimal LucroRealizadoVendas { get; set; }
    public decimal RetornoTotalGeral => LucroPrejuizoNaoRealizado + TotalProventos + LucroRealizadoVendas;
    public int QuantidadeAtivos { get; set; }
    public decimal TotalAcoes { get; set; }
    public decimal TotalFIIs { get; set; }
    public decimal PercentualAcoes => SaldoAtual > 0 ? (TotalAcoes / SaldoAtual) * 100 : 0;
    public decimal PercentualFIIs => SaldoAtual > 0 ? (TotalFIIs / SaldoAtual) * 100 : 0;
}
