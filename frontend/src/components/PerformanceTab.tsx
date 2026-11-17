import React, { useState, useMemo } from 'react';
import { Ativo, PeriodoPerformance } from '../types';
import { getPerformanceRanking } from '../utils/marketData';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Star,
  LineChart,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

interface PerformanceTabProps {
  ativos: Ativo[];
  favoritos: string[];
  onToggleFavorito: (ticker: string) => void;
  onSelectAtivo: (ativo: Ativo) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  ativos,
  favoritos,
  onToggleFavorito,
  onSelectAtivo,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoPerformance>('1D');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Acao' | 'FII'>('TODOS');

  const ranking = useMemo(() => {
    return getPerformanceRanking(periodo, filtroTipo, ativos);
  }, [periodo, filtroTipo, ativos]);

  const periodosInfo: { id: PeriodoPerformance; label: string; descricao: string }[] = [
    { id: '1D', label: 'No Dia (1D)', descricao: 'Pregão de hoje' },
    { id: '7D', label: '7 Dias (Semanal)', descricao: 'Última semana' },
    { id: '15D', label: '15 Dias (Quinzenal)', descricao: 'Últimos 15 dias' },
  ];

  const getMedalhaColor = (posicao: number, isAlta: boolean) => {
    if (isAlta) {
      if (posicao === 1) return 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30';
      if (posicao === 2) return 'bg-slate-300 text-slate-900 font-bold';
      if (posicao === 3) return 'bg-amber-700 text-amber-100 font-bold';
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold';
    } else {
      if (posicao === 1) return 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/30';
      if (posicao === 2) return 'bg-rose-600/80 text-rose-100 font-bold';
      if (posicao === 3) return 'bg-rose-700/80 text-rose-100 font-bold';
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Seletor de Períodos e Filtro */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950">
              <Award className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Top 7 Maiores Altas & Baixas
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe em tempo real os 7 ativos que mais renderam e os 7 que menos performaram na bolsa brasileira (B3).
          </p>
        </div>

        {/* Controles de Período e Tipo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Seletor de Período: 1D, 7D, 15D */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            {periodosInfo.map((p) => {
              const active = periodo === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filtro de Tipo: Todos, Ações, FIIs */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                filtroTipo === 'TODOS'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('Acao')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                filtroTipo === 'Acao'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ações
            </button>
            <button
              onClick={() => setFiltroTipo('FII')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                filtroTipo === 'FII'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FIIs
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Destaques Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Destaque Maior Alta */}
        {ranking.destaqueAlta && (
          <div
            onClick={() => onSelectAtivo(ranking.destaqueAlta.ativo)}
            className="cursor-pointer bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 hover:border-emerald-500/60 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Maior Alta do Período ({periodo})
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                1º Lugar
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-2xl font-black text-slate-100 font-mono group-hover:text-emerald-400 transition">
                  {ranking.destaqueAlta.ticker}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">{ranking.destaqueAlta.nome}</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-emerald-400 font-mono block">
                  +{ranking.destaqueAlta.variacaoPercentual.toFixed(2)}%
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  +{ranking.destaqueAlta.variacaoReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Destaque Maior Baixa */}
        {ranking.destaqueBaixa && (
          <div
            onClick={() => onSelectAtivo(ranking.destaqueBaixa.ativo)}
            className="cursor-pointer bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border border-rose-500/30 rounded-2xl p-5 hover:border-rose-500/60 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Maior Baixa do Período ({periodo})
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                Mais Pressionado
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-2xl font-black text-slate-100 font-mono group-hover:text-rose-400 transition">
                  {ranking.destaqueBaixa.ticker}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">{ranking.destaqueBaixa.nome}</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-rose-400 font-mono block">
                  {ranking.destaqueBaixa.variacaoPercentual.toFixed(2)}%
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {ranking.destaqueBaixa.variacaoReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Média Consolidada */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Média dos Ativos no Período
            </span>
            <span className="text-xs text-slate-500 font-mono">{periodo}</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-2xl font-black text-slate-100 font-mono block">
                {ranking.mediaVariacao >= 0 ? '+' : ''}
                {ranking.mediaVariacao.toFixed(2)}%
              </span>
              <p className="text-xs text-slate-400">Rendimento médio dos 30 ativos</p>
            </div>
            <div
              className={`p-2.5 rounded-xl ${
                ranking.mediaVariacao >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {ranking.mediaVariacao >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grade Principal: Duas Colunas com Top 7 Altas e Top 7 Baixas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA 1: TOP 7 QUE MAIS RENDERAM (MAIORES ALTAS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <span>🚀 Top 7 Que Mais Renderam</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Altas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Maiores valorizações acumuladas no período de {periodo}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {ranking.top7Altas.map((item) => {
              const fav = favoritos.includes(item.ticker.toUpperCase());
              const isFII = item.tipo === 'FII';
              const maxVal = ranking.destaqueAlta?.variacaoPercentual || 1;
              const barraWidth = Math.min(100, Math.max(10, (item.variacaoPercentual / maxVal) * 100));

              return (
                <div
                  key={`alta-${item.ticker}`}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-3.5 transition group flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    {/* Posição + Ticker + Detalhes */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${getMedalhaColor(
                          item.posicao,
                          true
                        )}`}
                      >
                        {item.posicao}º
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectAtivo(item.ativo)}
                            className="font-extrabold text-sm sm:text-base text-slate-100 font-mono hover:text-emerald-400 transition flex items-center gap-1 text-left"
                            title="Clique para abrir histórico de 5 anos com gráfico"
                          >
                            <span>{item.ticker}</span>
                            <LineChart className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                          </button>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isFII
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] sm:max-w-xs">
                          {item.nome}
                        </p>
                      </div>
                    </div>

                    {/* Preço e Variação + Ação */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-emerald-400 font-mono block">
                          +{item.variacaoPercentual.toFixed(2)}%
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      {/* Botão de Favoritar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorito(item.ticker);
                        }}
                        className={`p-1.5 rounded-lg border transition ${
                          fav
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
                        }`}
                        title={fav ? 'Remover dos favoritos' : 'Favoritar ativo'}
                      >
                        <Star className={`w-3.5 h-3.5 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Barra Visual de Intensidade */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barraWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: TOP 7 QUE MENOS PERFORMARAM (MAIORES BAIXAS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <span>🔻 Top 7 Menor Performance</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                    Baixas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Ativos com menor rendimento no período de {periodo}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {ranking.top7Baixas.map((item) => {
              const fav = favoritos.includes(item.ticker.toUpperCase());
              const isFII = item.tipo === 'FII';
              const minVal = Math.abs(ranking.destaqueBaixa?.variacaoPercentual || 1);
              const barraWidth = Math.min(100, Math.max(10, (Math.abs(item.variacaoPercentual) / minVal) * 100));

              return (
                <div
                  key={`baixa-${item.ticker}`}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-rose-500/40 rounded-2xl p-3.5 transition group flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    {/* Posição + Ticker + Detalhes */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${getMedalhaColor(
                          item.posicao,
                          false
                        )}`}
                      >
                        {item.posicao}º
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectAtivo(item.ativo)}
                            className="font-extrabold text-sm sm:text-base text-slate-100 font-mono hover:text-rose-400 transition flex items-center gap-1 text-left"
                            title="Clique para abrir histórico de 5 anos com gráfico"
                          >
                            <span>{item.ticker}</span>
                            <LineChart className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 opacity-0 group-hover:opacity-100 transition" />
                          </button>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isFII
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] sm:max-w-xs">
                          {item.nome}
                        </p>
                      </div>
                    </div>

                    {/* Preço e Variação + Ação */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-rose-400 font-mono block">
                          {item.variacaoPercentual.toFixed(2)}%
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      {/* Botão de Favoritar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorito(item.ticker);
                        }}
                        className={`p-1.5 rounded-lg border transition ${
                          fav
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
                        }`}
                        title={fav ? 'Remover dos favoritos' : 'Favoritar ativo'}
                      >
                        <Star className={`w-3.5 h-3.5 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Barra Visual de Intensidade de Baixa */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-600 to-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barraWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
