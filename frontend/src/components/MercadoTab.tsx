import React, { useState } from 'react';
import { Ativo } from '../types';
import { TrendingUp, Plus, Edit2, Search, Check, RefreshCw } from 'lucide-react';

interface MercadoTabProps {
  ativos: Ativo[];
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onAtualizarCotacao: (id: number, novoPreco: number) => Promise<void>;
  onCadastrarAtivo: () => void;
}

export const MercadoTab: React.FC<MercadoTabProps> = ({
  ativos,
  onOpenNovaOperacao,
  onAtualizarCotacao,
  onCadastrarAtivo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Acao' | 'FII'>('TODOS');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [precoEditado, setPrecoEditado] = useState<string>('');
  const [salvando, setSalvando] = useState(false);

  const filtered = ativos.filter((a) => {
    const matchSearch =
      a.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.setor && a.setor.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filtroTipo === 'TODOS' || a.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });

  const iniciarEdicao = (ativo: Ativo) => {
    setEditandoId(ativo.id);
    setPrecoEditado(ativo.precoAtual.toString());
  };

  const salvarEdicao = async (id: number) => {
    const preco = parseFloat(precoEditado.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      alert('Informe um preço válido.');
      return;
    }
    setSalvando(true);
    try {
      await onAtualizarCotacao(id, preco);
      setEditandoId(null);
    } catch (err) {
      alert('Erro ao atualizar cotação.');
    } finally {
      setSalvando(false);
    }
  };

  const acoesCount = ativos.filter((a) => a.tipo === 'Acao').length;
  const fiisCount = ativos.filter((a) => a.tipo === 'FII').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Top 30 Melhores Ativos da B3</h2>
          <p className="text-xs text-slate-400">
            Catálogo dos 15 principais fundos imobiliários e 15 maiores empresas da bolsa brasileira pré-configurados.
          </p>
        </div>

        <button
          onClick={onCadastrarAtivo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Outro Ativo</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar ticker, nome ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-3 py-1 rounded-md transition ${
              filtroTipo === 'TODOS' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({ativos.length})
          </button>
          <button
            onClick={() => setFiltroTipo('Acao')}
            className={`px-3 py-1 rounded-md transition ${
              filtroTipo === 'Acao' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ações ({acoesCount})
          </button>
          <button
            onClick={() => setFiltroTipo('FII')}
            className={`px-3 py-1 rounded-md transition ${
              filtroTipo === 'FII' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FIIs ({fiisCount})
          </button>
        </div>
      </div>

      {/* Grid de Cards dos Ativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ativo) => {
          const isEditando = editandoId === ativo.id;
          const isFII = ativo.tipo === 'FII';

          return (
            <div
              key={ativo.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-100 font-mono tracking-tight">
                      {ativo.ticker}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFII
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ativo.tipo}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      ativo.variacaoDia >= 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {ativo.variacaoDia >= 0 ? '+' : ''}
                    {ativo.variacaoDia.toFixed(2)}%
                  </span>
                </div>

                <h4 className="text-xs font-medium text-slate-300 mt-1 line-clamp-1">{ativo.nome}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{ativo.setor || 'Diversificado'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Cotação Atual</span>
                    {isEditando ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-400">R$</span>
                        <input
                          type="text"
                          value={precoEditado}
                          onChange={(e) => setPrecoEditado(e.target.value)}
                          className="w-20 px-2 py-0.5 text-xs rounded bg-slate-800 border border-emerald-500 text-white font-mono focus:outline-none"
                          autoFocus
                        />
                        <button
                          disabled={salvando}
                          onClick={() => salvarEdicao(ativo.id)}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-lg font-bold text-slate-100 font-mono">
                          {ativo.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <button
                          title="Atualizar cotação"
                          onClick={() => iniciarEdicao(ativo)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Dividend Yield</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {ativo.dividendYield > 0 ? `${ativo.dividendYield.toFixed(2)}% a.a.` : '-'}
                    </span>
                  </div>
                </div>

                {/* Botão Ação Comprar */}
                <button
                  onClick={() => onOpenNovaOperacao(ativo.ticker, 'COMPRA')}
                  className="w-full mt-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 font-semibold text-xs border border-slate-700 hover:border-emerald-500 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Comprar {ativo.ticker}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
