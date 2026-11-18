import { authClient } from './authService';
import {
  Ativo,
  Operacao,
  Provento,
  PosicaoCarteira,
  ResumoCarteira,
  HistoricoAtivo,
  PerformanceAtivo,
  PeriodoHistorico,
  PeriodoPerformance,
  NoticiaAtivo
} from '../types';
import { NOTICIAS_MERCADO } from '../utils/marketData';

type PerformanceApiItem = Omit<PerformanceAtivo, 'ativo'>;
interface PerformanceApiResponse {
  periodo: PeriodoPerformance;
  top7Altas: PerformanceApiItem[];
  top7Baixas: PerformanceApiItem[];
  destaqueAlta: PerformanceApiItem | null;
  destaqueBaixa: PerformanceApiItem | null;
}

export const InvestirApi = {
  // ----------------- CARTEIRA (PROTEGIDA) -----------------
  getResumo: async (): Promise<ResumoCarteira> => {
    const { data } = await authClient.get('/carteira/resumo');
    return data;
  },

  getPosicoes: async (): Promise<PosicaoCarteira[]> => {
    const { data } = await authClient.get('/carteira/posicoes');
    return data;
  },

  // ----------------- OPERAÇÕES (PROTEGIDA) -----------------
  getOperacoes: async (ticker?: string, tipo?: string): Promise<Operacao[]> => {
    const { data } = await authClient.get('/operacoes', { params: { ticker, tipo } });
    return data;
  },

  criarOperacao: async (operacao: {
    ticker?: string;
    ativoId?: number;
    tipoOperacao: 'COMPRA' | 'VENDA';
    dataOperacao: string;
    quantidade: number;
    precoUnitario: number;
    taxas?: number;
    observacoes?: string;
  }): Promise<Operacao> => {
    const { data } = await authClient.post('/operacoes', operacao);
    return data;
  },

  excluirOperacao: async (id: number): Promise<void> => {
    await authClient.delete(`/operacoes/${id}`);
  },

  // ----------------- PROVENTOS (PROTEGIDA) -----------------
  getProventos: async (ticker?: string, ano?: number): Promise<Provento[]> => {
    const { data } = await authClient.get('/proventos', { params: { ticker, ano } });
    return data;
  },

  criarProvento: async (provento: {
    ticker?: string;
    ativoId?: number;
    tipoProvento: string;
    dataCom?: string;
    dataPagamento: string;
    valorPorCota: number;
    quantidadeCotas: number;
    valorTotal: number;
    observacoes?: string;
  }): Promise<Provento> => {
    const { data } = await authClient.post('/proventos', provento);
    return data;
  },

  excluirProvento: async (id: number): Promise<void> => {
    await authClient.delete(`/proventos/${id}`);
  },

  // ----------------- ATIVOS (TOP 30 E CATÁLOGO) -----------------
  getAtivos: async (): Promise<Ativo[]> => {
    const { data } = await authClient.get('/ativos');
    return Array.isArray(data) ? data : [];
  },

  criarAtivo: async (ativo: {
    ticker: string;
    nome: string;
    tipo: string;
    setor?: string;
    precoAtual: number;
    variacaoDia?: number;
    dividendYield?: number;
  }): Promise<Ativo> => {
    const { data } = await authClient.post('/ativos', ativo);
    return data;
  },

  // ----------------- HISTÓRICO & PERFORMANCE (ATÉ 5 ANOS) -----------------
  getHistoricoAtivo: async (ticker: string, periodo: PeriodoHistorico): Promise<HistoricoAtivo> => {
    const { data } = await authClient.get(`/ativos/${ticker}/historico`, { params: { periodo } });
    return data;
  },

  getPerformanceRanking: async (periodo: PeriodoPerformance, filtroTipo: 'TODOS' | 'Acao' | 'FII' = 'TODOS'): Promise<PerformanceApiResponse> => {
    const { data } = await authClient.get('/ativos/performance', { params: { periodo, filtroTipo } });
    return data;
  },

  // ----------------- NOTÍCIAS & MERCADO -----------------
  getNoticias: async (): Promise<NoticiaAtivo[]> => {
    try {
      const { data } = await authClient.get('/noticias');
      return data;
    } catch {
      return NOTICIAS_MERCADO;
    }
  },
};
