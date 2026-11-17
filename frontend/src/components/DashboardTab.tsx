import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Coins, PieChart as PieChartIcon, Building2, Briefcase, Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PosicaoCarteira, ResumoCarteira } from '../types';

interface DashboardTabProps {
  resumo: ResumoCarteira | null;
  posicoes: PosicaoCarteira[];
  onNavigateTab: (tab: string) => void;
  onOpenNovaOperacao: (defaultTicker?: string) => void;
}

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16'];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  resumo,
  posicoes,
  onNavigateTab,
  onOpenNovaOperacao,
}) => {
  if (!resumo) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Carregando dados da carteira...
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
    if (posicoes.length > 8 && (percent ?? 0) < 0.03) {
      return null;
    }

    return (
      <text
        x={x}
        y={y}
        textAnchor={props.textAnchor || (x > cx ? 'start' : 'end')}
        dominantBaseline="central"
        className="text-xs font-semibold select-none"
      >
        <tspan fill={COLORS[index % COLORS.length]} fontWeight="bold">
          {name}
        </tspan>
        <tspan fill="#e2e8f0" fontSize="11">
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
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
          <span className="font-bold text-slate-100 text-sm">{ticker}</span>
          {nome && <span className="text-slate-400 text-xs truncate max-w-[140px]">{nome}</span>}
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-slate-200">
          <span className="font-bold text-emerald-400 text-sm">{valor}</span>
          <span className="text-slate-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
            {percentual}%
          </span>
        </div>
      </div>
    );
  };

  // Dados para o gráfico Ações vs FIIs
  const dataCategorias = [
    { name: 'Ações', value: resumo.totalAcoes, color: '#10b981' },
    { name: 'FIIs', value: resumo.totalFIIs, color: '#06b6d4' },
  ].filter((c) => c.value > 0);

  const isLucro = resumo.lucroPrejuizoNaoRealizado >= 0;

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investido */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Investido</span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {resumo.totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Custo de aquisição em carteira (Preço Médio)</p>
          </div>
        </div>

        {/* Saldo Atual / Patrimônio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Valor Atual (Mercado)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {resumo.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Cotação a mercado x cotas em custódia</p>
          </div>
        </div>

        {/* Lucro / Prejuízo Não Realizado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resultado da Carteira</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLucro ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isLucro ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className={`text-2xl font-bold ${isLucro ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isLucro ? '+' : ''}
                {resumo.lucroPrejuizoNaoRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isLucro ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isLucro ? '+' : ''}{resumo.rentabilidadePercentual.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Oscilação patrimonial vs custo médio</p>
          </div>
        </div>

        {/* Total de Proventos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Proventos Recebidos</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-400">
              {resumo.totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Dividendos, JCP e Rendimentos somados</p>
          </div>
        </div>
      </div>

      {/* Destaque: Retorno Total Geral (Variação + Proventos) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100">Retorno Total com Proventos Reinvestidos</h4>
            <p className="text-xs text-slate-400">Considera oscilação de mercado somada a todos os proventos recebidos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Retorno Líquido Total</span>
            <span className={`text-xl font-bold ${resumo.retornoTotalGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {resumo.retornoTotalGeral >= 0 ? '+' : ''}
              {resumo.retornoTotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('carteira')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Gráficos e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Alocação por Ativo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-slate-100">Alocação de Patrimônio por Ativo</h3>
            </div>
            <span className="text-xs text-slate-400">{posicoes.length} ativos em custódia</span>
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
                    innerRadius={48}
                    outerRadius={74}
                    paddingAngle={3}
                    label={renderCustomizedLabel}
                    labelLine={{ strokeWidth: 1.5 }}
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
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {posicoes.map((pos, idx) => (
                <div key={pos.ativoId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-950/70 transition">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-bold text-slate-200">{pos.ticker}</span>
                    <span className="text-slate-400 truncate max-w-[120px]">{pos.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-200 block">
                      {pos.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[11px] text-slate-400">{pos.percentualCarteira}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classes de Ativos (Ações vs FIIs) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h3 className="font-semibold text-slate-100">Classes de Ativos</h3>
            </div>

            <div className="space-y-4 mt-6">
              {/* Ações */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Ações Brasileiras</span>
                  <span className="font-bold text-emerald-400">{resumo.percentualAcoes.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full"
                    style={{ width: `${resumo.percentualAcoes}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {resumo.totalAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* FIIs */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Fundos Imobiliários (FIIs)</span>
                  <span className="font-bold text-cyan-400">{resumo.percentualFIIs.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-2.5 rounded-full"
                    style={{ width: `${resumo.percentualFIIs}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {resumo.totalFIIs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Deseja ver as melhores oportunidades?</span>
            <button
              onClick={() => onNavigateTab('performance')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Ver Altas & Baixas (Top 7) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
