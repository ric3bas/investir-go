import React, { useState, useMemo } from 'react';
import { Ativo, PeriodoHistorico } from '../types';
import { getHistoricoAtivo } from '../utils/marketData';
import {
  X,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  Newspaper,
  Calendar,
  Percent,
  DollarSign,
  BarChart2,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface AtivoDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ativo: Ativo | null;
  isFavorito: boolean;
  onToggleFavorito: (ticker: string) => void;
  onOpenNovaOperacao?: (ticker: string, tipo?: 'COMPRA' | 'VENDA') => void;
  onNavigateToNoticias?: (ticker: string) => void;
}

export const AtivoDetalhesModal: React.FC<AtivoDetalhesModalProps> = ({
  isOpen,
  onClose,
  ativo,
  isFavorito,
  onToggleFavorito,
  onOpenNovaOperacao,
  onNavigateToNoticias,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoHistorico>('5A');

  const periodosDisponiveis: { id: PeriodoHistorico; label: string; sub: string }[] = [
    { id: '1D', label: '1D', sub: 'Hoje' },
    { id: '7D', label: '7D', sub: '7 dias' },
    { id: '15D', label: '15D', sub: '15 dias' },
    { id: '1M', label: '1M', sub: '1 mês' },
    { id: '6M', label: '6M', sub: '6 meses' },
    { id: '1A', label: '1A', sub: '1 ano' },
    { id: '2A', label: '2A', sub: '2 anos' },
    { id: '5A', label: '5A', sub: '5 anos' },
  ];

  const historico = useMemo(() => {
    if (!ativo) return null;
    return getHistoricoAtivo(ativo.ticker, periodo, ativo.precoAtual);
  }, [ativo, periodo]);

  if (!isOpen || !ativo || !historico) return null;

  const isAlta = historico.variacaoPercentual >= 0;
  const isFII = ativo.tipo === 'FII';

  const periodoDescricao: Record<PeriodoHistorico, string> = {
    '1D': 'no dia de hoje',
    '7D': 'nos últimos 7 dias',
    '15D': 'nos últimos 15 dias',
    '1M': 'no último mês',
    '6M': 'nos últimos 6 meses',
    '1A': 'no último ano',
    '2A': 'nos últimos 2 anos',
    '5A': 'nos últimos 5 anos',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Superior do Modal */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg font-mono shadow-inner ${
                isFII
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {ativo.ticker.substring(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">
                  {ativo.ticker}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isFII
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {ativo.tipo}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-slate-400 hidden sm:inline">{ativo.setor || 'Diversificado'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ativo.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Favoritar */}
            <button
              onClick={() => onToggleFavorito(ativo.ticker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isFavorito
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star className={`w-4 h-4 ${isFavorito ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isFavorito ? 'Favoritado' : 'Favoritar'}</span>
            </button>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Destaque de Cotação e Variação no Período Selecionado */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Cotação Atual a Mercado
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
                  {ativo.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                    ativo.variacaoDia >= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}
                  title="Variação no pregão de hoje"
                >
                  {ativo.variacaoDia >= 0 ? '+' : ''}
                  {ativo.variacaoDia.toFixed(2)}% no dia
                </span>
              </div>
            </div>

            {/* Performance no Período Selecionado (Subiu ou Caiu) */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                isAlta
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isAlta ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}
              >
                {isAlta ? <TrendingUp className="w-6 h-6 stroke-[2.5]" /> : <TrendingDown className="w-6 h-6 stroke-[2.5]" />}
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wide opacity-80 block">
                  {isAlta ? 'Subiu no período' : 'Caiu no período'} ({periodo})
                </span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-lg font-black">
                    {isAlta ? '+' : ''}
                    {historico.variacaoPercentual.toFixed(2)}%
                  </span>
                  <span className="text-xs font-semibold opacity-90">
                    ({isAlta ? '+' : ''}
                    {historico.variacaoReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Variação {periodoDescricao[periodo]}
                </span>
              </div>
            </div>
          </div>

          {/* Seletor de Períodos (Tabs) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-300">Consultar Histórico:</span>
              <span className="text-slate-500">Selecione até 5 anos com gráfico</span>
            </div>

            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 overflow-x-auto no-scrollbar">
              {periodosDisponiveis.map((p) => {
                const isActive = periodo === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriodo(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gráfico Interativo com Recharts */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">
                  Evolução do Preço da Cotação — Período de {periodo} ({historico.pontos.length} amostras)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-slate-500">
                  Início: <strong className="text-slate-300">{historico.precoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </span>
                <span className="text-slate-500">
                  Final: <strong className="text-slate-300">{historico.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historico.pontos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradientVerde" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="areaGradientVermelho" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                  <XAxis
                    dataKey="data"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tickFormatter={(val) => `R$ ${val.toFixed(0)}`}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const varPonto = data.variacaoPeriodo;
                        const isPontoAlta = varPonto >= 0;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
                            <p className="text-slate-400 font-medium">{data.dataCompleta}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-slate-400">Preço:</span>
                              <span className="text-base font-extrabold text-slate-100 font-mono">
                                {data.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-slate-400">Var. acumulada:</span>
                              <span className={`font-bold ${isPontoAlta ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPontoAlta ? '+' : ''}
                                {varPonto.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="preco"
                    stroke={isAlta ? '#10b981' : '#f43f5e'}
                    strokeWidth={2.5}
                    fill={isAlta ? 'url(#areaGradientVerde)' : 'url(#areaGradientVermelho)'}
                    dot={historico.pontos.length <= 15 ? { r: 3, fill: isAlta ? '#10b981' : '#f43f5e' } : false}
                    activeDot={{ r: 6, fill: isAlta ? '#10b981' : '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards com Estatísticas do Período */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mínima do Período</span>
              <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                {historico.minima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Máxima do Período</span>
              <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                {historico.maxima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Preço Médio Período</span>
              <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                {historico.precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Dividend Yield Atual</span>
              <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                {ativo.dividendYield > 0 ? `${ativo.dividendYield.toFixed(2)}% a.a.` : '0.00%'}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações Rápidas */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Dados de cotação atualizados automaticamente para {ativo.ticker}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToNoticias && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToNoticias(ativo.ticker);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <span>Notícias de {ativo.ticker}</span>
              </button>
            )}

            {onOpenNovaOperacao && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNovaOperacao(ativo.ticker, 'COMPRA');
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Comprar {ativo.ticker}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
