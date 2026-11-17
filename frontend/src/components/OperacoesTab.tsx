import React, { useState } from 'react';
import { Operacao } from '../types';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, Calendar } from 'lucide-react';

interface OperacoesTabProps {
  operacoes: Operacao[];
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onExcluirOperacao: (id: number) => void;
}

export const OperacoesTab: React.FC<OperacoesTabProps> = ({
  operacoes,
  onOpenNovaOperacao,
  onExcluirOperacao,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'COMPRA' | 'VENDA'>('TODOS');

  const filtered = operacoes.filter((op) => {
    const matchSearch =
      op.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.nomeAtivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filtroTipo === 'TODOS' || op.tipoOperacao === filtroTipo;
    return matchSearch && matchTipo;
  });

  const totalOperado = filtered.reduce((acc, op) => acc + op.valorTotal, 0);

  const formatarData = (dataStr: string) => {
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Registro de Compras e Vendas</h2>
          <p className="text-xs text-slate-400">
            Lançamentos históricos conforme sua planilha de controle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar ticker ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filtro Tipo */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {(['TODOS', 'COMPRA', 'VENDA'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded-md transition ${
                  filtroTipo === tipo
                    ? tipo === 'COMPRA'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                      : tipo === 'VENDA'
                      ? 'bg-rose-500/20 text-rose-400 font-bold'
                      : 'bg-slate-800 text-slate-200 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tipo === 'TODOS' ? 'Todas' : tipo === 'COMPRA' ? 'Compras' : 'Vendas'}
              </button>
            ))}
          </div>

          {/* Botão Registrar */}
          <button
            onClick={() => onOpenNovaOperacao()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Resumo */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs">
        <span className="text-slate-400">
          Mostrando <strong className="text-slate-200">{filtered.length}</strong> de {operacoes.length} lançamentos
        </span>
        <div>
          <span className="text-slate-400 mr-2">Volume Total Filtrado:</span>
          <span className="font-bold text-slate-100 text-sm">
            {totalOperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Tabela de Operações (Estilo Planilha) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Empresa / Fundo</th>
                <th className="py-3 px-3">Ticker</th>
                <th className="py-3 px-3 text-right">Qtd</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-400">Preço Compra/Venda</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-3 text-right font-bold text-cyan-400">Preço Agora</th>
                <th className="py-3 px-3 text-right font-bold text-slate-200">Valor Agora</th>
                <th className="py-3 px-3 text-center">Operação</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhuma operação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((op) => {
                  const isCompra = op.tipoOperacao === 'COMPRA';
                  const valorAgoraTotal = op.quantidade * op.precoAtual;
                  const diferencaValor = valorAgoraTotal - op.valorTotal;

                  return (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition">
                      {/* Data */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                        {formatarData(op.dataOperacao)}
                      </td>

                      {/* Nome Empresa */}
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {op.nomeAtivo}
                      </td>

                      {/* Ticker */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-100 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs">
                          {op.ticker}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                        {op.quantidade.toLocaleString('pt-BR')}
                      </td>

                      {/* Preço Unitário */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                        {op.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                        {op.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Preço Agora */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-cyan-400">
                        {op.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Valor Agora Total */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-slate-100 block">
                          {valorAgoraTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        {isCompra && (
                          <span className={`text-[10px] block ${diferencaValor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {diferencaValor >= 0 ? '+' : ''}{diferencaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </td>

                      {/* Tipo Operação (COMPRA / VENDA) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCompra
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isCompra ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {op.tipoOperacao}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center">
                        <button
                          title="Excluir operação"
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a ${op.tipoOperacao} de ${op.quantidade} ${op.ticker}?`)) {
                              onExcluirOperacao(op.id);
                            }
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
