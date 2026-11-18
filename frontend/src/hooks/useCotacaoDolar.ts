import { useState, useEffect, useCallback } from 'react';

export interface CotacaoDolar {
  cotacao: number;
  variacao: number;
  maxima: number;
  minima: number;
  dataHora: string;
  carregando: boolean;
  atualizar: () => Promise<void>;
}

const FALLBACK_DOLAR = {
  cotacao: 5.84,
  variacao: 0.28,
  maxima: 5.87,
  minima: 5.81,
};

export const useCotacaoDolar = (): CotacaoDolar => {
  const [cotacao, setCotacao] = useState<number>(FALLBACK_DOLAR.cotacao);
  const [variacao, setVariacao] = useState<number>(FALLBACK_DOLAR.variacao);
  const [maxima, setMaxima] = useState<number>(FALLBACK_DOLAR.maxima);
  const [minima, setMinima] = useState<number>(FALLBACK_DOLAR.minima);
  const [dataHora, setDataHora] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [carregando, setCarregando] = useState<boolean>(false);

  const buscarCotacao = useCallback(async () => {
    try {
      setCarregando(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.USDBRL) {
          const bid = parseFloat(data.USDBRL.bid);
          const pct = parseFloat(data.USDBRL.pctChange);
          const high = parseFloat(data.USDBRL.high);
          const low = parseFloat(data.USDBRL.low);

          if (!isNaN(bid) && bid > 0) setCotacao(bid);
          if (!isNaN(pct)) setVariacao(pct);
          if (!isNaN(high) && high > 0) setMaxima(high);
          if (!isNaN(low) && low > 0) setMinima(low);
          setDataHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch {
      // Em caso de offline, sandbox ou falha de rede, preserva cotação de referência sem quebrar a UI
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarCotacao();
    const interval = setInterval(buscarCotacao, 5 * 60 * 1000); // Atualiza a cada 5 minutos
    return () => clearInterval(interval);
  }, [buscarCotacao]);

  return {
    cotacao,
    variacao,
    maxima,
    minima,
    dataHora,
    carregando,
    atualizar: buscarCotacao,
  };
};
