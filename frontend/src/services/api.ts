import axios from 'axios';
import {
  Ativo,
  Operacao,
  Provento,
  PosicaoCarteira,
  ResumoCarteira,
  HistoricoAtivo,
  PeriodoHistorico,
  PeriodoPerformance,
  NoticiaAtivo
} from '../types';
import {
  TOP_30_ATIVOS,
  MOCK_OPERACOES,
  MOCK_PROVENTOS,
  calcularResumoEPosicoesMock,
  getHistoricoAtivo,
  getPerformanceRanking,
  NOTICIAS_MERCADO
} from '../utils/marketData';

const api = axios.create({
  baseURL: '/api',
  timeout: 3000,
});

// Armazenamento em memória/localStorage local como fallback caso PostgreSQL esteja offline
let ativosLocais: Ativo[] = [...TOP_30_ATIVOS];
let operacoesLocais: Operacao[] = [...MOCK_OPERACOES];
let proventosLocais: Provento[] = [...MOCK_PROVENTOS];

export const InvestirApi = {
  // ----------------- CARTEIRA -----------------
  getResumo: async (): Promise<ResumoCarteira> => {
    try {
      const { data } = await api.get('/carteira/resumo');
      return data;
    } catch {
      // Fallback seguro em caso de indisponibilidade do banco
      const { resumo } = calcularResumoEPosicoesMock(operacoesLocais, proventosLocais, ativosLocais);
      return resumo;
    }
  },

  getPosicoes: async (): Promise<PosicaoCarteira[]> => {
    try {
      const { data } = await api.get('/carteira/posicoes');
      return data;
    } catch {
      const { posicoes } = calcularResumoEPosicoesMock(operacoesLocais, proventosLocais, ativosLocais);
      return posicoes;
    }
  },

  // ----------------- OPERAÇÕES (COMPRAS & VENDAS) -----------------
  getOperacoes: async (ticker?: string, tipo?: string): Promise<Operacao[]> => {
    try {
      const { data } = await api.get('/operacoes', { params: { ticker, tipo } });
      return data;
    } catch {
      let filtradas = [...operacoesLocais];
      if (ticker) {
        filtradas = filtradas.filter((o) => o.ticker.toUpperCase() === ticker.toUpperCase());
      }
      if (tipo) {
        filtradas = filtradas.filter((o) => o.tipoOperacao.toUpperCase() === tipo.toUpperCase());
      }
      return filtradas;
    }
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
    try {
      const { data } = await api.post('/operacoes', operacao);
      return data;
    } catch {
      const ticker = operacao.ticker?.toUpperCase() || 'ATIVO';
      const ativo = ativosLocais.find((a) => a.ticker.toUpperCase() === ticker);
      const nova: Operacao = {
        id: operacoesLocais.length + 1,
        ativoId: operacao.ativoId || ativo?.id || 1,
        ticker,
        nomeAtivo: ativo?.nome || ticker,
        tipoAtivo: ativo?.tipo || (ticker.endsWith('11') ? 'FII' : 'Acao'),
        tipoOperacao: operacao.tipoOperacao,
        dataOperacao: operacao.dataOperacao,
        quantidade: operacao.quantidade,
        precoUnitario: operacao.precoUnitario,
        valorTotal: operacao.quantidade * operacao.precoUnitario,
        taxas: operacao.taxas || 0,
        observacoes: operacao.observacoes,
        precoAtual: ativo?.precoAtual || operacao.precoUnitario,
        valorAtualTotal: operacao.quantidade * (ativo?.precoAtual || operacao.precoUnitario),
        createdAt: new Date().toISOString(),
      };
      operacoesLocais = [nova, ...operacoesLocais];
      return nova;
    }
  },

  excluirOperacao: async (id: number): Promise<void> => {
    try {
      await api.delete(`/operacoes/${id}`);
    } catch {
      operacoesLocais = operacoesLocais.filter((o) => o.id !== id);
    }
  },

  // ----------------- PROVENTOS -----------------
  getProventos: async (ticker?: string, ano?: number): Promise<Provento[]> => {
    try {
      const { data } = await api.get('/proventos', { params: { ticker, ano } });
      return data;
    } catch {
      let filtrados = [...proventosLocais];
      if (ticker) {
        filtrados = filtrados.filter((p) => p.ticker.toUpperCase() === ticker.toUpperCase());
      }
      if (ano) {
        filtrados = filtrados.filter((p) => new Date(p.dataPagamento).getFullYear() === ano);
      }
      return filtrados;
    }
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
    try {
      const { data } = await api.post('/proventos', provento);
      return data;
    } catch {
      const ticker = provento.ticker?.toUpperCase() || 'ATIVO';
      const ativo = ativosLocais.find((a) => a.ticker.toUpperCase() === ticker);
      const novo: Provento = {
        id: proventosLocais.length + 1,
        ativoId: provento.ativoId || ativo?.id || 1,
        ticker,
        nomeAtivo: ativo?.nome || ticker,
        tipoProvento: provento.tipoProvento as any,
        dataCom: provento.dataCom,
        dataPagamento: provento.dataPagamento,
        valorPorCota: provento.valorPorCota,
        quantidadeCotas: provento.quantidadeCotas,
        valorTotal: provento.valorTotal,
        observacoes: provento.observacoes,
      };
      proventosLocais = [novo, ...proventosLocais];
      return novo;
    }
  },

  excluirProvento: async (id: number): Promise<void> => {
    try {
      await api.delete(`/proventos/${id}`);
    } catch {
      proventosLocais = proventosLocais.filter((p) => p.id !== id);
    }
  },

  // ----------------- ATIVOS (TOP 30 E CATÁLOGO) -----------------
  getAtivos: async (): Promise<Ativo[]> => {
    try {
      const { data } = await api.get('/ativos');
      if (Array.isArray(data) && data.length > 0) {
        ativosLocais = data;
        return data;
      }
      return ativosLocais;
    } catch {
      return ativosLocais;
    }
  },

  atualizarCotacao: async (id: number, precoAtual: number, variacaoDia?: number, dividendYield?: number): Promise<void> => {
    try {
      await api.put(`/ativos/${id}/cotacao`, { precoAtual, variacaoDia, dividendYield });
    } catch {
      ativosLocais = ativosLocais.map((a) =>
        a.id === id
          ? {
              ...a,
              precoAtual,
              variacaoDia: variacaoDia !== undefined ? variacaoDia : a.variacaoDia,
              dividendYield: dividendYield !== undefined ? dividendYield : a.dividendYield,
              dataAtualizacao: new Date().toISOString(),
            }
          : a
      );
    }
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
    try {
      const { data } = await api.post('/ativos', ativo);
      return data;
    } catch {
      const novo: Ativo = {
        id: ativosLocais.length + 1,
        ticker: ativo.ticker.toUpperCase(),
        nome: ativo.nome,
        tipo: ativo.tipo as any,
        setor: ativo.setor,
        precoAtual: ativo.precoAtual,
        variacaoDia: ativo.variacaoDia || 0,
        dividendYield: ativo.dividendYield || 0,
        dataAtualizacao: new Date().toISOString(),
      };
      ativosLocais.push(novo);
      return novo;
    }
  },

  // ----------------- HISTÓRICO & PERFORMANCE (ATÉ 5 ANOS) -----------------
  getHistoricoAtivo: async (ticker: string, periodo: PeriodoHistorico, precoAtual?: number): Promise<HistoricoAtivo> => {
    try {
      const { data } = await api.get(`/ativos/${ticker}/historico`, { params: { periodo } });
      return data;
    } catch {
      return getHistoricoAtivo(ticker, periodo, precoAtual);
    }
  },

  getPerformanceRanking: async (periodo: PeriodoPerformance, filtroTipo: 'TODOS' | 'Acao' | 'FII' = 'TODOS') => {
    try {
      const { data } = await api.get('/ativos/performance', { params: { periodo, filtroTipo } });
      return data;
    } catch {
      return getPerformanceRanking(periodo, filtroTipo, ativosLocais);
    }
  },

  // ----------------- NOTÍCIAS & MERCADO -----------------
  getNoticias: async (): Promise<NoticiaAtivo[]> => {
    try {
      const { data } = await api.get('/noticias');
      return data;
    } catch {
      return NOTICIAS_MERCADO;
    }
  },
};
