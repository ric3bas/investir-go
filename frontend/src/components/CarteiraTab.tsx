import React, { useState } from 'react';
import { PosicaoCarteira } from '../types';
import { Plus, Minus, Coins, Search, LineChart, ArrowDownUp, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

interface CarteiraTabProps {
  posicoes: PosicaoCarteira[];
  totalLancamentos?: number;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
  onOpenLancamentos?: () => void;
  onSelectTicker?: (ticker: string) => void;
}

export const CarteiraTab: React.FC<CarteiraTabProps> = ({
  posicoes,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onSelectTicker,
}) => {
  const { esconderValores, toggleEsconderValores, formatarValor } = usePrivacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Acao' | 'FII'>('TODOS');
  const [ordenacao, setOrdenacao] = useState<'saldo' | 'rentabilidade' | 'ticker'>('saldo');

  const filtered = posicoes
    .filter((p) => {
      const matchSearch =
        p.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = filtroTipo === 'TODOS' || p.tipo === filtroTipo;
      return matchSearch && matchTipo;
    })
    .sort((a, b) => {
      if (ordenacao === 'saldo') return b.saldoAtual - a.saldoAtual;
      if (ordenacao === 'rentabilidade') return b.rentabilidadePercentual - a.rentabilidadePercentual;
      return a.ticker.localeCompare(b.ticker);
    });

  const totalInvestido = filtered.reduce((acc, p) => acc + p.totalInvestido, 0);
  const totalSaldoAtual = filtered.reduce((acc, p) => acc + p.saldoAtual, 0);
  const totalVariacao = totalSaldoAtual - totalInvestido;
  const totalRentabilidade = totalInvestido > 0 ? (totalVariacao / totalInvestido) * 100 : 0;
  const totalProventos = filtered.reduce((acc, p) => acc + p.totalProventosRecebidos, 0);

  return (
    <div className="space-y-6">
      
      {/* Header & Controles de Filtro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Custódia & Preço Médio</h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {filtered.length} ativos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle de preço médio fiscal ponderado, cotações a mercado e fluxo de rendimentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Busca */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar ticker ou ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition w-44 sm:w-56"
            />
          </div>

          {/* Filtro de Tipo Segmentado */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.08] p-0.5 text-xs">
            {(['TODOS', 'Acao', 'FII'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded-lg transition font-semibold text-xs ${
                  filtroTipo === tipo
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tipo === 'TODOS' ? 'Todos' : tipo === 'Acao' ? 'Ações' : 'FIIs'}
              </button>
            ))}
          </div>

          {/* Ordenação */}
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition font-medium"
          >
            <option value="saldo" className="bg-[#0b0f1a] text-slate-200">Maior Saldo</option>
            <option value="rentabilidade" className="bg-[#0b0f1a] text-slate-200">Maior Rentabilidade</option>
            <option value="ticker" className="bg-[#0b0f1a] text-slate-200">Ticker (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Resumo da Tabela Filtrada */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#090d18]/90 border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">Total Investido (Custo)</span>
            <button
              onClick={toggleEsconderValores}
              className="p-1 rounded text-slate-500 hover:text-slate-200 transition"
              title={esconderValores ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {esconderValores ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="font-bold text-slate-100 text-base sm:text-lg font-mono tabular-nums mt-1 block">
            {formatarValor(totalInvestido)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d18]/90 border border-white/[0.06] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">Saldo Atual a Mercado</span>
          <span className="font-bold text-slate-100 text-base sm:text-lg font-mono tabular-nums mt-1 block">
            {formatarValor(totalSaldoAtual)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d18]/90 border border-white/[0.06] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">Oscilação Patrimonial</span>
          <span className={`font-bold text-base sm:text-lg font-mono tabular-nums mt-1 block ${totalVariacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {esconderValores ? '••••••••' : `${totalVariacao >= 0 ? '+' : ''}${totalVariacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            <span className="text-xs ml-1 font-semibold opacity-85">({totalRentabilidade.toFixed(2)}%)</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d18]/90 border border-white/[0.06] shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">Proventos Creditados</span>
          <span className="font-bold text-amber-400 text-base sm:text-lg font-mono tabular-nums mt-1 block">
            {formatarValor(totalProventos)}
          </span>
        </div>
      </div>

      {/* Tabela de Carteira Estilo Terminal */}
      <div className="bg-[#090d18]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c1220] border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Ativo</th>
                <th className="py-3.5 px-3 text-right">Qtd</th>
                <th className="py-3.5 px-3 text-right text-emerald-400 font-bold">Preço Médio</th>
                <th className="py-3.5 px-3 text-right text-cyan-400 font-bold">Preço Atual</th>
                <th className="py-3.5 px-3 text-right">Investido</th>
                <th className="py-3.5 px-3 text-right text-slate-100 font-bold">Saldo Agora</th>
                <th className="py-3.5 px-3 text-right">Lucro / Prejuízo</th>
                <th className="py-3.5 px-3 text-right text-amber-400">Proventos</th>
                <th className="py-3.5 px-3 text-right">Peso</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">Nenhum ativo encontrado com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((pos) => {
                  const isPosLucro = pos.variacaoReais >= 0;
                  return (
                    <tr key={pos.ativoId} className="hover:bg-white/[0.03] transition-colors group">
                      {/* Ativo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                            pos.tipo === 'FII'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {pos.tipo}
                          </span>
                          <div>
                            {onSelectTicker ? (
                              <button
                                onClick={() => onSelectTicker(pos.ticker)}
                                className="font-bold text-white text-sm hover:text-emerald-400 font-mono flex items-center gap-1 transition text-left tracking-tight"
                                title="Ver análise técnica e histórico"
                              >
                                <span>{pos.ticker}</span>
                                <LineChart className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ) : (
                              <span className="font-bold text-white text-sm block font-mono">{pos.ticker}</span>
                            )}
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">{pos.nome}</span>
                          </div>
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-200 tabular-nums">
                        {pos.quantidadeCustodia.toLocaleString('pt-BR')}
                      </td>

                      {/* Preço Médio */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {pos.precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>

                      {/* Preço Atual */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-cyan-400 tabular-nums">
                        {pos.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                      </td>

                      {/* Total Investido */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400 tabular-nums">
                        {formatarValor(pos.totalInvestido)}
                      </td>

                      {/* Saldo Atual */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                        {formatarValor(pos.saldoAtual)}
                      </td>

                      {/* Lucro / Prejuízo */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span className={`font-bold block tabular-nums ${isPosLucro ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {esconderValores ? '••••••••' : `${isPosLucro ? '+' : ''}${pos.variacaoReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        </span>
                        <span className={`text-[10px] tabular-nums font-semibold ${isPosLucro ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {isPosLucro ? '+' : ''}{pos.rentabilidadePercentual.toFixed(2)}%
                        </span>
                      </td>

                      {/* Proventos */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-400 tabular-nums">
                        {pos.totalProventosRecebidos > 0 ? (
                          formatarValor(pos.totalProventosRecebidos)
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Peso na carteira */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400 font-semibold tabular-nums">
                        {pos.percentualCarteira.toFixed(1)}%
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Comprar mais cotas"
                            onClick={() => onOpenNovaOperacao(pos.ticker, 'COMPRA')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <button
                            title="Vender cotas"
                            onClick={() => onOpenNovaOperacao(pos.ticker, 'VENDA')}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <button
                            title="Registrar Provento"
                            onClick={() => onOpenNovoProvento(pos.ticker)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition"
                          >
                            <Coins className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
