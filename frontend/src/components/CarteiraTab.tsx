import React, { useState } from 'react';
import { PosicaoCarteira } from '../types';
import { Plus, Minus, Coins, Search, LineChart, ArrowDownUp } from 'lucide-react';

interface CarteiraTabProps {
  posicoes: PosicaoCarteira[];
  totalLancamentos?: number;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
  onOpenLancamentos: () => void;
  onSelectTicker?: (ticker: string) => void;
}

export const CarteiraTab: React.FC<CarteiraTabProps> = ({
  posicoes,
  totalLancamentos,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onOpenLancamentos,
  onSelectTicker,
}) => {
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">Posições em Custódia</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe Preço Médio ponderado, valor investido, cotação atual a mercado e proventos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar ticker ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filtro Tipo */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {(['TODOS', 'Acao', 'FII'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1.5 rounded-lg transition font-bold ${filtroTipo === tipo
                    ? 'bg-slate-800 text-emerald-400'
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
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="saldo">Maior Saldo Atual</option>
            <option value="rentabilidade">Maior Rentabilidade</option>
            <option value="ticker">Ordem Alfabética</option>
          </select>

          {/* Botão Lançamentos (Abre Modal de Lançamentos) */}
          <button
            onClick={onOpenLancamentos}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 transition shadow-sm"
            title="Ver histórico de lançamentos (compras e vendas)"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lançamentos</span>
            {totalLancamentos !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                {totalLancamentos}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Resumo da Tabela filtrada */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Investido na Seleção</span>
          <span className="font-bold text-slate-100 text-sm font-mono mt-0.5 block">
            {totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Saldo a Mercado</span>
          <span className="font-bold text-slate-100 text-sm font-mono mt-0.5 block">
            {totalSaldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Variação Não Realizada</span>
          <span className={`font-bold text-sm font-mono mt-0.5 block ${totalVariacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalVariacao >= 0 ? '+' : ''}
            {totalVariacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({totalRentabilidade.toFixed(2)}%)
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Proventos Recebidos</span>
          <span className="font-bold text-amber-400 text-sm font-mono mt-0.5 block">
            {totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Tabela de Carteira */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Ativo</th>
                <th className="py-3.5 px-3 text-right">Qtd</th>
                <th className="py-3.5 px-3 text-right font-bold text-emerald-400">Preço Médio</th>
                <th className="py-3.5 px-3 text-right font-bold text-cyan-400">Preço Atual</th>
                <th className="py-3.5 px-3 text-right">Valor Investido</th>
                <th className="py-3.5 px-3 text-right font-bold text-slate-200">Valor Agora</th>
                <th className="py-3.5 px-3 text-right">Lucro / Prejuízo</th>
                <th className="py-3.5 px-3 text-right text-amber-400">Proventos</th>
                <th className="py-3.5 px-3 text-right">Peso</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="text-sm">Nenhum ativo encontrado na carteira.</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={onOpenLancamentos}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700 transition"
                      >
                        <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ver Lançamentos</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((pos) => {
                  const isPosLucro = pos.variacaoReais >= 0;
                  return (
                    <tr key={pos.ativoId} className="hover:bg-slate-800/40 transition group">
                      {/* Ativo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pos.tipo === 'FII' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                            {pos.tipo}
                          </span>
                          <div>
                            {onSelectTicker ? (
                              <button
                                onClick={() => onSelectTicker(pos.ticker)}
                                className="font-extrabold text-slate-100 text-sm hover:text-emerald-400 font-mono flex items-center gap-1 transition text-left"
                                title="Ver gráfico histórico de até 5 anos"
                              >
                                <span>{pos.ticker}</span>
                                <LineChart className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100" />
                              </button>
                            ) : (
                              <span className="font-bold text-slate-100 text-sm block font-mono">{pos.ticker}</span>
                            )}
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">{pos.nome}</span>
                          </div>
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-200">
                        {pos.quantidadeCustodia.toLocaleString('pt-BR')}
                      </td>

                      {/* Preço Médio */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {pos.precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>

                      {/* Preço Atual */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-cyan-400">
                        {pos.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                      </td>

                      {/* Total Investido */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        {pos.totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Saldo Atual */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                        {pos.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Lucro / Prejuízo */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span className={`font-semibold block ${isPosLucro ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPosLucro ? '+' : ''}
                          {pos.variacaoReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className={`text-[10px] ${isPosLucro ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {isPosLucro ? '+' : ''}{pos.rentabilidadePercentual.toFixed(2)}%
                        </span>
                      </td>

                      {/* Proventos */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-amber-400">
                        {pos.totalProventosRecebidos > 0 ? (
                          pos.totalProventosRecebidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Peso na carteira */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                        {pos.percentualCarteira.toFixed(1)}%
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Comprar mais cotas"
                            onClick={() => onOpenNovaOperacao(pos.ticker, 'COMPRA')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Vender cotas"
                            onClick={() => onOpenNovaOperacao(pos.ticker, 'VENDA')}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Registrar Provento"
                            onClick={() => onOpenNovoProvento(pos.ticker)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition"
                          >
                            <Coins className="w-3.5 h-3.5" />
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
