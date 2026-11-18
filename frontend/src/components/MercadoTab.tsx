import React, { useState } from 'react';
import { Ativo } from '../types';
import { TrendingUp, Plus, Edit2, Search, Check, Star, LineChart, Info } from 'lucide-react';

interface MercadoTabProps {
  ativos: Ativo[];
  favoritos: string[];
  onToggleFavorito: (ticker: string) => void;
  onSelectAtivo: (ativo: Ativo) => void;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onAtualizarCotacao: (id: number, novoPreco: number) => Promise<void>;
  onCadastrarAtivo: () => void;
}

export const MercadoTab: React.FC<MercadoTabProps> = ({
  ativos,
  favoritos,
  onToggleFavorito,
  onSelectAtivo,
  onOpenNovaOperacao,
  onAtualizarCotacao,
  onCadastrarAtivo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Acao' | 'FII' | 'FAVORITOS'>('TODOS');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [precoEditado, setPrecoEditado] = useState<string>('');
  const [salvando, setSalvando] = useState(false);

  const filtered = ativos.filter((a) => {
    const matchSearch =
      a.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.setor && a.setor.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchTipo = true;
    if (filtroTipo === 'Acao') matchTipo = a.tipo === 'Acao';
    else if (filtroTipo === 'FII') matchTipo = a.tipo === 'FII';
    else if (filtroTipo === 'FAVORITOS') matchTipo = favoritos.includes(a.ticker.toUpperCase());

    return matchSearch && matchTipo;
  });

  const iniciarEdicao = (ativo: Ativo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditandoId(ativo.id);
    setPrecoEditado(ativo.precoAtual.toString());
  };

  const salvarEdicao = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
  const favsCount = ativos.filter((a) => favoritos.includes(a.ticker.toUpperCase())).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Top 30 Melhores Ativos da B3
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              15 Ações + 15 FIIs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Clique em qualquer ativo para abrir o modal de análise com gráfico histórico de até 5 anos.
          </p>
        </div>

        <button
          onClick={onCadastrarAtivo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition self-start md:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Cadastrar Outro Ativo</span>
        </button>
      </div>

      {/* Barra Informativa com Dica */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>
            <strong>Dica Interativa:</strong> Clique em qualquer card de ativo abaixo para consultar o histórico de até 5 anos com gráfico, indicando claramente o quanto subiu ou caiu.
          </span>
        </div>
        <span className="text-[11px] text-emerald-400/80 font-mono hidden md:inline">
          ⭐ Use a estrela para favoritar
        </span>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar ticker, empresa ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              filtroTipo === 'TODOS' ? 'bg-slate-800 text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({ativos.length})
          </button>
          <button
            onClick={() => setFiltroTipo('Acao')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              filtroTipo === 'Acao' ? 'bg-emerald-500/20 text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ações ({acoesCount})
          </button>
          <button
            onClick={() => setFiltroTipo('FII')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              filtroTipo === 'FII' ? 'bg-cyan-500/20 text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FIIs ({fiisCount})
          </button>
          <button
            onClick={() => setFiltroTipo('FAVORITOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
              filtroTipo === 'FAVORITOS' ? 'bg-amber-500/20 text-amber-300 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3 h-3 ${filtroTipo === 'FAVORITOS' ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favoritos ({favsCount})</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards dos Ativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ativo) => {
          const isEditando = editandoId === ativo.id;
          const isFII = ativo.tipo === 'FII';
          const isFav = favoritos.includes(ativo.ticker.toUpperCase());
          const isAlta = ativo.variacaoDia >= 0;

          return (
            <div
              key={ativo.id}
              onClick={() => onSelectAtivo(ativo)}
              className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Barra superior de destaque sutil */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isFav
                    ? 'bg-amber-400'
                    : isFII
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`}
              />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-slate-100 font-mono tracking-tight group-hover:text-emerald-400 transition">
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

                  <div className="flex items-center gap-2">
                    {/* Botão Favoritar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorito(ativo.ticker);
                      }}
                      className={`p-1.5 rounded-lg border transition ${
                        isFav
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/80 text-slate-500 hover:text-slate-300 border-slate-700'
                      }`}
                      title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    {/* Variação do Dia */}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                        isAlta
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isAlta ? '+' : ''}
                      {ativo.variacaoDia.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-medium text-slate-300 mt-1.5 line-clamp-1">{ativo.nome}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{ativo.setor || 'Diversificado'}</p>
              </div>

              {/* Botão Hover Hint: Ver Gráfico 5 Anos */}
              <div className="my-2.5 py-1 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition">
                <span className="flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Consultar até 5 anos com gráfico</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300">
                  Ver modal →
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Cotação Atual</span>
                    {isEditando ? (
                      <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
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
                          onClick={(e) => salvarEdicao(ativo.id, e)}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-lg font-extrabold text-slate-100 font-mono">
                          {ativo.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <button
                          title="Simular/Editar cotação"
                          onClick={(e) => iniciarEdicao(ativo, e)}
                          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNovaOperacao(ativo.ticker, 'COMPRA');
                  }}
                  className="w-full mt-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-600 hover:text-white text-emerald-400 font-semibold text-xs border border-slate-700/80 hover:border-emerald-500 transition flex items-center justify-center gap-1.5 shadow-sm"
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
