import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Coins,
  PieChart as PieChartIcon,
  Building2,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  Percent,
  Wallet,
  Eye,
  EyeOff
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PosicaoCarteira, ResumoCarteira } from '../types';
import { usePrivacy } from '../context/PrivacyContext';

interface DashboardTabProps {
  resumo: ResumoCarteira | null;
  posicoes: PosicaoCarteira[];
  onNavigateTab: (tab: string) => void;
  onOpenNovaOperacao: (defaultTicker?: string) => void;
}

// Paleta institucional nórdica de alta fidelidade
const PALETTE = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#3b82f6', // Cobalt Blue
  '#84cc16', // Lime
];

interface AllocationChartItem {
  name: string;
  value: number;
  tipo: string;
  percentual: number;
  nome: string;
  color: string;
}

interface OutsideLabelPosition {
  side: 'left' | 'right';
  y: number;
}

const RADIAN = Math.PI / 180;

/**
 * Espalha os rótulos de cada lado do donut para impedir sobreposição entre
 * posições pequenas e próximas. Os ângulos seguem a orientação padrão do Pie.
 */
const getOutsideLabelPositions = (
  data: AllocationChartItem[],
  cy: number,
  outerRadius: number,
): OutsideLabelPosition[] => {
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  if (total <= 0) return data.map(() => ({ side: 'right', y: cy }));

  let currentAngle = 90;
  const positions = data.map((item, index) => {
    const sliceAngle = (Math.max(item.value, 0) / total) * 360;
    const midAngle = currentAngle - sliceAngle / 2;
    currentAngle -= sliceAngle;

    const cosine = Math.cos(-midAngle * RADIAN);
    const desiredY = cy + (outerRadius + 34) * Math.sin(-midAngle * RADIAN);

    return {
      index,
      side: cosine >= 0 ? 'right' as const : 'left' as const,
      desiredY,
      y: desiredY,
    };
  });

  const top = 22;
  const bottom = cy * 2 - 22;

  (['left', 'right'] as const).forEach((side) => {
    const sidePositions = positions
      .filter((position) => position.side === side)
      .sort((a, b) => a.desiredY - b.desiredY);

    if (sidePositions.length === 0) return;

    const availableHeight = Math.max(0, bottom - top);
    const gap = sidePositions.length > 1
      ? Math.min(38, availableHeight / (sidePositions.length - 1))
      : 0;

    sidePositions.forEach((position, index) => {
      const previousY = index === 0 ? top - gap : sidePositions[index - 1].y;
      position.y = Math.max(position.desiredY, previousY + gap, top);
    });

    const overflow = sidePositions[sidePositions.length - 1].y - bottom;
    if (overflow > 0) {
      sidePositions.forEach((position) => {
        position.y -= overflow;
      });
    }

    const topOverflow = top - sidePositions[0].y;
    if (topOverflow > 0) {
      sidePositions.forEach((position) => {
        position.y += topOverflow;
      });
    }
  });

  return positions
    .sort((a, b) => a.index - b.index)
    .map(({ side, y }) => ({ side, y }));
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  resumo,
  posicoes,
  onNavigateTab,
  onOpenNovaOperacao,
}) => {
  const { esconderValores, toggleEsconderValores, formatarValor } = usePrivacy();

  if (!resumo) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-3">
        <div className="w-9 h-9 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Sincronizando custódia B3...</span>
      </div>
    );
  }

  const isLucro = resumo.lucroPrejuizoNaoRealizado >= 0;

  // Dados para o gráfico de pizza por ativo
  const dataAtivos: AllocationChartItem[] = posicoes.map((p, idx) => ({
    name: p.ticker,
    value: p.saldoAtual,
    tipo: p.tipo,
    percentual: p.percentualCarteira,
    nome: p.nome,
    color: PALETTE[idx % PALETTE.length],
  }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const ticker = item.name;
    const rawVal = item.value;
    const valor = typeof rawVal === 'number'
      ? formatarValor(rawVal)
      : rawVal;
    const percentual = item.payload?.percentual ?? 0;
    const nome = item.payload?.nome;
    const cor = item.payload?.color || PALETTE[0];

    return (
      <div className="bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/[0.1] px-4 py-3 rounded-2xl shadow-2xl text-xs space-y-1.5 z-50 min-w-[190px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cor }} />
          <span className="font-bold text-white text-sm font-mono tracking-tight">{ticker}</span>
          {nome && <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{nome}</span>}
        </div>
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.06] text-slate-200">
          <span className="font-bold text-emerald-400 font-mono tabular-nums text-sm">{valor}</span>
          <span className="text-slate-300 font-mono font-semibold bg-white/[0.06] px-2 py-0.5 rounded-md text-[10px]">
            {percentual}%
          </span>
        </div>
      </div>
    );
  };

  const renderOutsideLabel = ({ cx, cy, midAngle, outerRadius, index }: any) => {
    const item = dataAtivos[index];
    if (!item) return null;

    const positions = getOutsideLabelPositions(dataAtivos, Number(cy), Number(outerRadius));
    const position = positions[index];
    const isRight = position.side === 'right';
    const direction = isRight ? 1 : -1;
    const angle = -Number(midAngle) * RADIAN;
    const startX = Number(cx) + (Number(outerRadius) + 3) * Math.cos(angle);
    const startY = Number(cy) + (Number(outerRadius) + 3) * Math.sin(angle);
    const elbowX = Number(cx) + (Number(outerRadius) + 17) * Math.cos(angle);
    const elbowY = Number(cy) + (Number(outerRadius) + 17) * Math.sin(angle);
    const isCompact = Number(cx) < 210;
    const estimatedLabelWidth = isCompact ? 58 : 88;
    const horizontalRoom = Number(cx) - Number(outerRadius);
    const connectorLength = Math.max(10, Math.min(44, horizontalRoom - estimatedLabelWidth - 8));
    const lineEndX = Number(cx) + direction * (Number(outerRadius) + connectorLength);
    const textX = lineEndX + direction * 7;
    const textAnchor = isRight ? 'start' : 'end';

    return (
      <g className="pointer-events-none">
        <title>{`${item.name} — ${item.nome}: ${item.percentual.toFixed(1)}%, ${formatarValor(item.value)}`}</title>
        <circle cx={startX} cy={startY} r={2.5} fill={item.color} />
        <polyline
          points={`${startX},${startY} ${elbowX},${elbowY} ${lineEndX},${position.y}`}
          fill="none"
          stroke={item.color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        <text
          x={textX}
          y={position.y - 4}
          textAnchor={textAnchor}
          fill="#f8fafc"
          className="font-mono font-bold"
          fontSize={isCompact ? 9 : 11}
        >
          {item.name}
          <tspan fill={item.color} dx={5}>{item.percentual.toFixed(1)}%</tspan>
        </text>
        <text
          x={textX}
          y={position.y + 11}
          textAnchor={textAnchor}
          fill="#94a3b8"
          className="font-mono tabular-nums"
          fontSize={isCompact ? 8 : 9}
        >
          {formatarValor(item.value)}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* ===================================================================== */}
      {/* 1. PORTFOLIO COMMAND CENTER (HERO MASTER CARD)                        */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1220] via-[#090d18] to-[#070a12] border border-white/[0.08] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_20px_40px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-8">
        
        {/* Glow de ambientação financeira */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Lado Esquerdo: Grande Métrica de Patrimônio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Patrimônio Consolidado • Mercado B3
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <button
                type="button"
                onClick={toggleEsconderValores}
                className={`p-1 rounded-lg border transition cursor-pointer ${
                  esconderValores
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border-white/[0.08]'
                }`}
                title={esconderValores ? 'Mostrar valores monetários' : 'Ocultar valores monetários (Modo Privacidade)'}
                aria-label={esconderValores ? 'Mostrar valores' : 'Ocultar valores'}
              >
                {esconderValores ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white tabular-nums">
                {formatarValor(resumo.saldoAtual)}
              </h2>

              {/* Badge de Lucro / Prejuízo em Destaque */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition ${
                  isLucro
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-sm'
                }`}
              >
                {isLucro ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />}
                <span>
                  {esconderValores
                    ? '••••••••'
                    : `${isLucro ? '+' : ''}${resumo.lucroPrejuizoNaoRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                </span>
                <span className="opacity-80">
                  ({isLucro ? '+' : ''}{resumo.rentabilidadePercentual.toFixed(2)}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Valorização de mercado baseada nas últimas cotações oficiais dos ativos em custódia.
            </p>
          </div>

          {/* Lado Direito: Ações Diretas no Portfólio */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onOpenNovaOperacao()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_16px_rgba(16,185,129,0.35)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Lançar Operação</span>
            </button>

            <button
              onClick={() => onNavigateTab('carteira')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] font-semibold text-xs transition"
            >
              <span>Ver Minha Carteira</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Régua de Métricas Secundárias (Ledger de 3 Colunas) */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Custo Total Investido */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">Total Investido (Custo PM)</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-200 tabular-nums">
              {formatarValor(resumo.totalInvestido)}
            </div>
            <span className="text-[10px] text-slate-500 block">Preço médio ponderado de aquisição</span>
          </div>

          {/* Proventos Acumulados */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">Proventos & Dividendos</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {formatarValor(resumo.totalProventos)}
            </div>
            <span className="text-[10px] text-slate-500 block">Fluxo de caixa de dividendos e JCP</span>
          </div>

          {/* Retorno Total Geral */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Briefcase className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">Retorno Total Geral</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${resumo.retornoTotalGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {esconderValores ? '••••••••' : `${resumo.retornoTotalGeral >= 0 ? '+' : ''}${resumo.retornoTotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            </div>
            <span className="text-[10px] text-slate-500 block">Oscilação de mercado + Proventos creditados</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BENTO GRID DE INTELIGÊNCIA E ALOCAÇÃO                             */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Card 1 (Span 8): Alocação de Patrimônio por Ativo */}
        <div className="lg:col-span-8 rounded-3xl bg-[#090d18]/90 border border-white/[0.08] p-6 shadow-xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Alocação e Pesos de Custódia</h3>
                <p className="text-[11px] text-slate-400">Distribuição patrimonial por ativo individual</p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-slate-400 bg-white/[0.03] px-3 py-1 rounded-xl border border-white/[0.06]">
              {posicoes.length} Ativos
            </span>
          </div>

          <div className="space-y-5">
            {/* Gráfico Donut com rótulos externos e linhas-guia por ativo */}
            <div
              className="h-[340px] sm:h-[390px] relative flex items-center justify-center"
              role="img"
              aria-label={`Gráfico de alocação da carteira com ${posicoes.length} ativos`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataAtivos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="29%"
                    outerRadius="45%"
                    paddingAngle={3}
                    labelLine={false}
                    label={renderOutsideLabel}
                    isAnimationActive={false}
                  >
                    {dataAtivos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Indicador central do Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Total</span>
                <span className="text-lg font-bold font-mono text-white tabular-nums">
                  {posicoes.length}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono">Posições 💼</span>
              </div>
            </div>

            {/* Detalhamento textual complementar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {posicoes.map((pos, idx) => (
                <div
                  key={pos.ativoId}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                      <span className="font-bold font-mono text-slate-100">{pos.ticker}</span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[100px]">{pos.nome}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-200 tabular-nums">
                        {formatarValor(pos.saldoAtual)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        {pos.percentualCarteira}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de progresso visual */}
                  <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pos.percentualCarteira, 100)}%`,
                        backgroundColor: PALETTE[idx % PALETTE.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2 (Span 4): Classes de Ativos & Rebalanceamento */}
        <div className="lg:col-span-4 rounded-3xl bg-[#090d18]/90 border border-white/[0.08] p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-4">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Classes de Ativos</h3>
                <p className="text-[11px] text-slate-400">Diversificação setorial B3</p>
              </div>
            </div>

            {/* Ações */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Ações Brasileiras</span>
                <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                  {resumo.percentualAcoes.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${resumo.percentualAcoes}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                <span>Total em Ações:</span>
                <span className="text-slate-200 font-semibold">
                  {formatarValor(resumo.totalAcoes)}
                </span>
              </div>
            </div>

            {/* FIIs */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Fundos Imobiliários (FIIs)</span>
                <span className="font-mono font-bold text-cyan-400 text-sm tabular-nums">
                  {resumo.percentualFIIs.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${resumo.percentualFIIs}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                <span>Total em FIIs:</span>
                <span className="text-slate-200 font-semibold">
                  {formatarValor(resumo.totalFIIs)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => onNavigateTab('performance')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-xs font-semibold text-emerald-400 transition"
            >
              <span>Ver Melhores Oportunidades (Top 7)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
