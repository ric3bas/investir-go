import axios from 'axios';
import { Ativo, Operacao, Provento, PosicaoCarteira, ResumoCarteira } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const InvestirApi = {
  // Carteira
  getResumo: async (): Promise<ResumoCarteira> => {
    const { data } = await api.get('/carteira/resumo');
    return data;
  },

  getPosicoes: async (): Promise<PosicaoCarteira[]> => {
    const { data } = await api.get('/carteira/posicoes');
    return data;
  },

  // Operações (Compras / Vendas)
  getOperacoes: async (ticker?: string, tipo?: string): Promise<Operacao[]> => {
    const { data } = await api.get('/operacoes', { params: { ticker, tipo } });
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
    const { data } = await api.post('/operacoes', operacao);
    return data;
  },

  excluirOperacao: async (id: number): Promise<void> => {
    await api.delete(`/operacoes/${id}`);
  },

  // Proventos
  getProventos: async (ticker?: string, ano?: number): Promise<Provento[]> => {
    const { data } = await api.get('/proventos', { params: { ticker, ano } });
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
    const { data } = await api.post('/proventos', provento);
    return data;
  },

  excluirProvento: async (id: number): Promise<void> => {
    await api.delete(`/proventos/${id}`);
  },

  // Ativos (Top 30 e Mercado)
  getAtivos: async (): Promise<Ativo[]> => {
    const { data } = await api.get('/ativos');
    return data;
  },

  atualizarCotacao: async (id: number, precoAtual: number, variacaoDia?: number, dividendYield?: number): Promise<void> => {
    await api.put(`/ativos/${id}/cotacao`, { precoAtual, variacaoDia, dividendYield });
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
    const { data } = await api.post('/ativos', ativo);
    return data;
  }
};
