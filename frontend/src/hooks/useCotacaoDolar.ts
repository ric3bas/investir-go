import { useState, useEffect, useCallback } from 'react';
import { InvestirApi } from '../services/api';

export interface CotacaoDolar {
  cotacao: number;
  variacao: number;
  maxima: number;
  minima: number;
  dataHora: string;
  carregando: boolean;
  atualizar: () => Promise<void>;
}

export const useCotacaoDolar = (): CotacaoDolar => {
  const [cotacao, setCotacao] = useState(0);
  const [variacao, setVariacao] = useState(0);
  const [maxima, setMaxima] = useState(0);
  const [minima, setMinima] = useState(0);
  const [dataHora, setDataHora] = useState('--:--');
  const [carregando, setCarregando] = useState<boolean>(false);

  const buscarCotacao = useCallback(async (forcar = false) => {
    try {
      setCarregando(true);
      const data = await InvestirApi.getPainelMercado(forcar);
      if (data.dolar) {
        setCotacao(data.dolar.valor);
        setVariacao(data.dolar.variacaoPercentual);
        setMaxima(data.dolar.maxima);
        setMinima(data.dolar.minima);
        setDataHora(new Date(data.dolar.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      // Preserva a última cotação válida sem introduzir valores simulados.
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void buscarCotacao(false);
    const interval = setInterval(() => void buscarCotacao(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [buscarCotacao]);

  return {
    cotacao,
    variacao,
    maxima,
    minima,
    dataHora,
    carregando,
    atualizar: () => buscarCotacao(true),
  };
};
