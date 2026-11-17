import React, { useState, useEffect } from 'react';
import { Operacao } from '../types';
import {
  X,
  ArrowDownUp,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Layers
} from 'lucide-react';

interface LancamentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  operacoes: Operacao[];
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onExcluirOperacao: (id: number) => void;
}

export const LancamentosModal: React.FC<LancamentosModalProps> = ({
  isOpen,
  onClose,
  operacoes,
  onOpenNovaOperacao,
  onExcluirOperacao,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'COMPRA' | 'VENDA'>('TODOS');

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
              <ArrowDownUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                  Lançamentos da Carteira
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold border border-slate-700">
                  {operacoes.length} {operacoes.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Histórico detalhado de todas as compras e vendas efetuadas na sua carteira.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Controles (Busca, Filtros e Ação) */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
            {/* Campo de Pesquisa */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por ticker ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro Tipo */}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs">
              {(['TODOS', 'COMPRA', 'VENDA'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
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
          </div>

          {/* Botão Novo Lançamento */}
          <button
            onClick={() => onOpenNovaOperacao()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>

        {/* Barra de Resumo */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Mostrando <strong className="text-slate-200">{filtered.length}</strong> de {operacoes.length} lançamentos
          </span>
          <div>
            <span className="mr-2">Volume Total:</span>
            <strong className="text-slate-100 font-mono text-sm">
              {totalOperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
        </div>

        {/* Tabela de Operações com Scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-[250px] p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Empresa / Fundo</th>
                <th className="py-3 px-3">Ticker</th>
                <th className="py-3 px-3 text-center">Operação</th>
                <th className="py-3 px-3 text-right">Qtd</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-400">Preço Compra/Venda</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-3 text-right font-bold text-cyan-400">Preço Agora</th>
                <th className="py-3 px-3 text-right font-bold text-slate-200">Valor Agora</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="text-sm">Nenhum lançamento encontrado com os filtros atuais.</p>
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFiltroTipo('TODOS');
                        }}
                        className="mt-2 text-xs text-emerald-400 hover:underline"
                      >
                        Limpar filtros de busca
                      </button>
                    )}
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
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                        {op.nomeAtivo}
                      </td>

                      {/* Ticker */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-100 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs">
                          {op.ticker}
                        </span>
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
                          <span
                            className={`text-[10px] block ${
                              diferencaValor >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {diferencaValor >= 0 ? '+' : ''}
                            {diferencaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center">
                        <button
                          title="Excluir operação"
                          onClick={() => {
                            if (
                              confirm(
                                `Deseja realmente excluir a ${op.tipoOperacao} de ${op.quantidade} ${op.ticker}?`
                              )
                            ) {
                              onExcluirOperacao(op.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Clique fora ou pressione ESC para fechar</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
