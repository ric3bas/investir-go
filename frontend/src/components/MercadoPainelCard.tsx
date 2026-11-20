import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { InvestirApi } from '../services/api';
import { MercadoIndicador, MercadoPainel } from '../types';

type Periodo = 7 | 30;

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const pontos = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const reais = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export const MercadoPainelCard: React.FC = () => {
  const [painel, setPainel] = useState<MercadoPainel | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (forcar = false) => {
    setCarregando(true);
    setErro(null);
    try {
      setPainel(await InvestirApi.getPainelMercado(forcar));
    } catch {
      setErro('Não foi possível consultar os indicadores agora.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(false);
    const intervalo = window.setInterval(() => void carregar(false), 5 * 60 * 1000);
    return () => window.clearInterval(intervalo);
  }, [carregar]);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#080d17] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_20px_55px_rgba(0,0,0,0.2)]">
      <header className="flex flex-col gap-4 border-b border-white/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white sm:text-base">Pulso do mercado</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Ibovespa e dólar comercial · atualização automática</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="flex rounded-xl border border-white/[0.07] bg-black/20 p-1">
            {([7, 30] as Periodo[]).map((dias) => (
              <button
                key={dias}
                type="button"
                onClick={() => setPeriodo(dias)}
                className={`rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold transition ${
                  periodo === dias ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {dias}D
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void carregar(true)}
            disabled={carregando}
            aria-label="Atualizar Ibovespa e dólar"
            aria-busy={carregando}
            className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 text-slate-400 transition hover:border-emerald-400/25 hover:text-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {erro && !painel ? (
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-300">{erro}</p>
          <button type="button" onClick={() => void carregar(true)} className="mt-3 text-xs font-bold text-emerald-300 hover:text-emerald-200">
            Tentar novamente
          </button>
        </div>
      ) : carregando && !painel ? (
        <div className="grid gap-px bg-white/[0.05] md:grid-cols-2">
          <IndicadorSkeleton />
          <IndicadorSkeleton />
        </div>
      ) : (
        <div className="grid gap-px bg-white/[0.05] md:grid-cols-2">
          <IndicadorCard indicador={painel?.ibovespa ?? null} periodo={periodo} tipo="ibov" />
          <IndicadorCard indicador={painel?.dolar ?? null} periodo={periodo} tipo="dolar" />
        </div>
      )}

      {(painel?.avisos.length ?? 0) > 0 && (
        <div className="border-t border-amber-300/10 bg-amber-300/[0.035] px-4 py-2.5 text-[10px] text-amber-200/80 sm:px-6">
          {painel?.avisos.join(' ')}
        </div>
      )}
    </section>
  );
};

const IndicadorCard: React.FC<{
  indicador: MercadoIndicador | null;
  periodo: Periodo;
  tipo: 'ibov' | 'dolar';
}> = ({ indicador, periodo, tipo }) => {
  const dados = useMemo(
    () => (indicador?.historico ?? []).slice(-periodo).map((ponto) => ({
      ...ponto,
      rotulo: dataCurta.format(new Date(ponto.data)),
    })),
    [indicador, periodo],
  );

  if (!indicador) {
    return <div className="flex min-h-72 items-center justify-center bg-[#090e18] p-6 text-sm text-slate-500">Indicador indisponível.</div>;
  }

  const positivo = indicador.variacaoPercentual >= 0;
  const cor = tipo === 'ibov' ? '#34d399' : '#fbbf24';
  const Icone = tipo === 'ibov' ? BarChart3 : CircleDollarSign;
  const valorFormatado = tipo === 'ibov'
    ? pontos.format(indicador.valor)
    : `R$ ${reais.format(indicador.valor)}`;

  return (
    <article className="min-w-0 bg-[#090e18] p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]" style={{ color: cor }}>
            <Icone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{indicador.codigo}</span>
            <h3 className="truncate text-sm font-bold text-slate-100">{indicador.nome}</h3>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] font-bold ${
          positivo ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
        }`}>
          {positivo ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {positivo ? '+' : ''}{indicador.variacaoPercentual.toFixed(2)}%
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-black tracking-tight text-white tabular-nums sm:text-3xl">{valorFormatado}</p>
          <p className="mt-1 text-[10px] text-slate-500">Atualizado em {dataHora.format(new Date(indicador.atualizadoEm))}</p>
        </div>
        <div className="flex gap-4 text-right text-[10px]">
          <div><span className="block uppercase tracking-wider text-slate-600">Mínima</span><strong className="mt-0.5 block font-mono text-slate-300">{formatarExtremo(indicador.minima, tipo)}</strong></div>
          <div><span className="block uppercase tracking-wider text-slate-600">Máxima</span><strong className="mt-0.5 block font-mono text-slate-300">{formatarExtremo(indicador.maxima, tipo)}</strong></div>
        </div>
      </div>

      <div className="mt-4 h-36 w-full sm:h-40" role="img" aria-label={`Gráfico de ${indicador.nome} nos últimos ${periodo} dias`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={`mercado-${tipo}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity={0.24} />
                <stop offset="100%" stopColor={cor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.07)" />
            <XAxis dataKey="rotulo" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: '#64748b', fontSize: 9 }} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<MercadoTooltip tipo={tipo} cor={cor} />} cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 1 }} />
            <Area type="linear" dataKey="valor" stroke={cor} strokeWidth={2} fill={`url(#mercado-${tipo})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[9px] uppercase tracking-wider text-slate-600">Fonte: {indicador.fonte}</p>
    </article>
  );
};

const MercadoTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string; tipo: 'ibov' | 'dolar'; cor: string }> = ({ active, payload, label, tipo, cor }) => {
  if (!active || !payload?.length) return null;
  const valor = Number(payload[0].value);
  return (
    <div className="rounded-xl border border-white/[0.1] bg-[#070b13]/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
      <span className="block text-[9px] text-slate-500">{label}</span>
      <strong className="mt-1 block font-mono text-xs tabular-nums" style={{ color: cor }}>
        {tipo === 'ibov' ? `${pontos.format(valor)} pts` : `R$ ${reais.format(valor)}`}
      </strong>
    </div>
  );
};

const IndicadorSkeleton = () => (
  <div className="min-h-72 animate-pulse bg-[#090e18] p-6">
    <div className="h-4 w-28 rounded bg-white/[0.06]" />
    <div className="mt-5 h-8 w-44 rounded bg-white/[0.07]" />
    <div className="mt-8 h-36 rounded-2xl bg-white/[0.035]" />
  </div>
);

const formatarExtremo = (valor: number, tipo: 'ibov' | 'dolar') =>
  tipo === 'ibov' ? pontos.format(valor) : `R$ ${reais.format(valor)}`;

export default MercadoPainelCard;
