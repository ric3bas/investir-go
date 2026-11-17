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

// ------------------- HISTÓRICO E GRÁFICOS (ATÉ 5 ANOS) -------------------
export type PeriodoHistorico = '1D' | '7D' | '15D' | '1M' | '6M' | '1A' | '2A' | '5A';

export interface HistoricoPonto {
  data: string;           // Rótulo curto do eixo X (ex: "10:00", "12/Nov", "Jan/24")
  preco: number;          // Cotação no momento
  variacaoPeriodo: number;// % variação em relação ao início do período
  dataCompleta: string;   // Data/hora legível para o tooltip
}

export interface HistoricoAtivo {
  ticker: string;
  nome: string;
  periodo: PeriodoHistorico;
  precoInicial: number;
  precoFinal: number;
  variacaoReais: number;
  variacaoPercentual: number;
  minima: number;
  maxima: number;
  precoMedio: number;
  pontos: HistoricoPonto[];
}

// ------------------- PERFORMANCE & RANKING (TOP 7) -------------------
export type PeriodoPerformance = '1D' | '7D' | '15D';

export interface PerformanceAtivo {
  posicao: number;
  ativo: Ativo;
  ticker: string;
  nome: string;
  tipo: 'Acao' | 'FII' | 'BDR' | 'ETF';
  setor?: string;
  precoAtual: number;
  precoInicial: number;
  variacaoPercentual: number;
  variacaoReais: number;
  isAlta: boolean;
}

// ------------------- NOTÍCIAS & FAVORITOS -------------------
export type CategoriaNoticia = 'Proventos' | 'Fato Relevante' | 'Resultado' | 'Mercado' | 'Analise';
export type SentimentoNoticia = 'Positivo' | 'Neutro' | 'Atencao';

export interface NoticiaAtivo {
  id: string;
  ticker: string;
  tickersRelacionados?: string[];
  titulo: string;
  resumo: string;
  fonte: string;
  dataPublicacao: string;
  categoria: CategoriaNoticia;
  sentimento: SentimentoNoticia;
  link?: string;
}
