import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Coins, PieChart as PieChartIcon, Building2, Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PosicaoCarteira, ResumoCarteira } from '../types';

interface DashboardTabProps {
  resumo: ResumoCarteira | null;
  posicoes: PosicaoCarteira[];
  onNavigateTab: (tab: string) => void;
  onOpenNovaOperacao: (defaultTicker?: string) => void;
}

// Curated institutional color palette for financial visual balance
const COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#84cc16', // Lime
];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  resumo,
  posicoes,
  onNavigateTab,
}) => {
  if (!resumo) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span className="text-xs font-medium tracking-wide">Carregando métricas da carteira...</span>
      </div>
    );
  }

  // Dados para o gráfico de pizza por ativo
  const dataAtivos = posicoes.map((p, idx) => ({
    name: p.ticker,
    value: p.saldoAtual,
    tipo: p.tipo,
    percentual: p.percentualCarteira,
    nome: p.nome,
    color: COLORS[idx % COLORS.length],
  }));

  const renderCustomizedLabel = (props: any) => {
    const { cx, x, y, name, index, percent } = props;
    if (posicoes.length > 8 && (percent ?? 0) < 0.035) {
      return null;
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor={props.textAnchor || (x > cx ? 'start' : 'end')}
        dominantBaseline="central"
        className="text-[11px] font-mono font-medium select-none"
      >
        <tspan fill={COLORS[index % COLORS.length]} fontWeight="600">
          {name}
        </tspan>
        <tspan fill="#94a3b8" fontSize="10">
          {` ${((percent ?? 0) * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const ticker = item.name;
    const rawVal = item.value;
    const valor = typeof rawVal === 'number'
      ? rawVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : rawVal;
    const percentual = item.payload?.percentual ?? 0;
    const nome = item.payload?.nome;
    const cor = item.payload?.color || COLORS[item.payload?.index % COLORS.length] || '#10b981';

    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1.5 z-50 min-w-[170px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cor }} />
          <span className="font-bold text-slate-100 text-sm tracking-tight font-mono">{ticker}</span>
          {nome && <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{nome}</span>}
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/[0.06] text-slate-200">
          <span className="font-bold text-emerald-400 font-mono tabular-nums text-sm">{valor}</span>
          <span className="text-slate-300 font-mono font-semibold bg-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">
            {percentual}%
          </span>
        </div>
      </div>
    );
  };

  const isLucro = resumo.lucroPrejuizoNaoRealizado >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cards de Métricas Principais (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investido */}
        <div className="fintech-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Investido</span>
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4 text-slate-300" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl lg:text-[26px] font-bold font-mono text-slate-100 tabular-nums tracking-tight">
              {resumo.totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Custo de aquisição (Preço Médio)</p>
          </div>
        </div>

        {/* Saldo Atual / Patrimônio */}
        <div className="fintech-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patrimônio Atual</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl lg:text-[26px] font-bold font-mono text-slate-100 tabular-nums tracking-tight">
              {resumo.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Cotação a mercado x custódia</p>
          </div>
        </div>

        {/* Lucro / Prejuízo Não Realizado */}
        <div className="fintech-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resultado da Carteira</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isLucro
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isLucro ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3
                className={`text-2xl lg:text-[26px] font-bold font-mono tabular-nums tracking-tight ${
                  isLucro ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isLucro ? '+' : ''}
                {resumo.lucroPrejuizoNaoRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isLucro
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                }`}
              >
                {isLucro ? '+' : ''}{resumo.rentabilidadePercentual.toFixed(2)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Oscilação de mercado vs PM</p>
          </div>
        </div>

        {/* Total de Proventos */}
        <div className="fintech-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proventos Recebidos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl lg:text-[26px] font-bold font-mono text-amber-400 tabular-nums tracking-tight">
              {resumo.totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Dividendos, JCP e Rendimentos</p>
          </div>
        </div>
      </div>

      {/* Destaque: Retorno Total Geral (Variação + Proventos) */}
      <div className="fintech-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm tracking-tight">Retorno Total com Proventos Reinvestidos</h4>
            <p className="text-xs text-slate-400">Lucro de capital somado a todo fluxo de proventos creditados na carteira</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Retorno Líquido Total</span>
            <span
              className={`text-xl font-bold font-mono tabular-nums tracking-tight ${
                resumo.retornoTotalGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {resumo.retornoTotalGeral >= 0 ? '+' : ''}
              {resumo.retornoTotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('carteira')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.08] transition shadow-sm"
          >
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Gráficos e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Alocação por Ativo */}
        <div className="fintech-card rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-100 text-sm tracking-tight">Alocação de Patrimônio por Ativo</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.04]">
              {posicoes.length} ativos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataAtivos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    label={renderCustomizedLabel}
                    labelLine={{ strokeWidth: 1.2, stroke: '#475569' }}
                  >
                    {dataAtivos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista dos maiores pesos */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {posicoes.map((pos, idx) => (
                <div
                  key={pos.ativoId}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.05] transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-bold font-mono text-slate-200">{pos.ticker}</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[110px]">{pos.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-slate-200 block tabular-nums text-[11px]">
                      {pos.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{pos.percentualCarteira}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classes de Ativos (Ações vs FIIs) */}
        <div className="fintech-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-100 text-sm tracking-tight">Classes de Ativos</h3>
            </div>

            <div className="space-y-4 mt-6">
              {/* Ações */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-300">Ações Brasileiras</span>
                  <span className="font-bold font-mono text-emerald-400 tabular-nums">{resumo.percentualAcoes.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/[0.04]">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${resumo.percentualAcoes}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block tabular-nums">
                  {resumo.totalAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* FIIs */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-300">Fundos Imobiliários (FIIs)</span>
                  <span className="font-bold font-mono text-cyan-400 tabular-nums">{resumo.percentualFIIs.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/[0.04]">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${resumo.percentualFIIs}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block tabular-nums">
                  {resumo.totalFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between">
            <span className="text-[11px]">Análise de mercado</span>
            <button
              onClick={() => onNavigateTab('performance')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] transition"
            >
              Altas & Baixas (Top 7) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
