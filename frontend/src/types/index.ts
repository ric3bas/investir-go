export interface Ativo {
  id: number;
  ticker: string;
  nome: string;
  tipo: 'Acao' | 'FII' | 'BDR' | 'ETF';
  setor?: string;
  precoAtual: number;
  variacaoDia: number;
  dividendYield: number;
  dataAtualizacao: string;
}

export interface Operacao {
  id: number;
  ativoId: number;
  ticker: string;
  nomeAtivo: string;
  tipoAtivo: string;
  tipoOperacao: 'COMPRA' | 'VENDA';
  dataOperacao: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  taxas: number;
  observacoes?: string;
  precoAtual: number;
  valorAtualTotal: number;
  createdAt: string;
}

export interface Provento {
  id: number;
  ativoId: number;
  ticker: string;
  nomeAtivo: string;
  tipoProvento: 'Dividendo' | 'JCP' | 'Rendimento' | 'Amortizacao';
  dataCom?: string;
  dataPagamento: string;
  valorPorCota: number;
  quantidadeCotas: number;
  valorTotal: number;
  observacoes?: string;
}

export interface PosicaoCarteira {
  ativoId: number;
  ticker: string;
  nome: string;
  tipo: string;
  setor?: string;
  quantidadeCustodia: number;
  precoMedio: number;
  precoAtual: number;
  totalInvestido: number;
  saldoAtual: number;
  variacaoReais: number;
  rentabilidadePercentual: number;
  totalProventosRecebidos: number;
  lucroRealizadoVendas: number;
  lucroTotalGeral: number;
  percentualCarteira: number;
}

export interface ResumoCarteira {
  totalInvestido: number;
  saldoAtual: number;
  lucroPrejuizoNaoRealizado: number;
  rentabilidadePercentual: number;
  totalProventos: number;
  lucroRealizadoVendas: number;
  retornoTotalGeral: number;
  quantidadeAtivos: number;
  totalAcoes: number;
  totalFIIs: number;
  percentualAcoes: number;
  percentualFIIs: number;
}
