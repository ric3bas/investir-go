import React, { useState, useMemo } from 'react';
import { Ativo, PeriodoPerformance } from '../types';
import { getPerformanceRanking, buscarAtivosMercado, AtivoPesquisaResultado } from '../utils/marketData';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Star,
  LineChart,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  CheckCircle2,
  X,
  Edit2,
  RefreshCw
} from 'lucide-react';

interface PerformanceTabProps {
  ativos: Ativo[];
  favoritos: string[];
  onToggleFavorito: (ticker: string) => void;
  onSelectAtivo: (ativo: Ativo) => void;
  onAtualizarPrecos?: () => void; // Adicionado
  carregandoPrecos?: boolean; // Adicionado
  onCadastrarAtivo?: (dados?: {
    ticker?: string;
    nome?: string;
    tipo?: 'Acao' | 'FII' | 'BDR' | 'ETF';
    setor?: string;
    precoAtual?: number;
    dividendYield?: number;
  }) => void;
  onSalvarAtivoRapido?: (ativo: {
    ticker: string;
    nome: string;
    tipo: string;
    setor?: string;
    precoAtual: number;
    dividendYield?: number;
  }) => Promise<void>;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  ativos,
  favoritos,
  onToggleFavorito,
  onSelectAtivo,
  onAtualizarPrecos, // Adicionado
  carregandoPrecos, // Adicionado
  onCadastrarAtivo,
  onSalvarAtivoRapido,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoPerformance>('1D');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Acao' | 'FII'>('TODOS');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroTipoPesquisa, setFiltroTipoPesquisa] = useState<'TODOS' | 'Acao' | 'FII'>('TODOS');
  const [salvandoTicker, setSalvandoTicker] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const resultadosBusca = useMemo(() => {
    return buscarAtivosMercado(termoPesquisa, filtroTipoPesquisa, ativos);
  }, [termoPesquisa, filtroTipoPesquisa, ativos]);

  const handleAdicionarAtivoBase = async (item: AtivoPesquisaResultado) => {
    if (onSalvarAtivoRapido) {
      setSalvandoTicker(item.ticker);
      try {
        await onSalvarAtivoRapido({
          ticker: item.ticker,
          nome: item.nome,
          tipo: item.tipo,
          setor: item.setor,
          precoAtual: item.precoAtual,
          dividendYield: item.dividendYield,
        });
        setSucessoMsg(`Ativo ${item.ticker} adicionado à base com sucesso!`);
        setTimeout(() => setSucessoMsg(null), 3500);
      } catch (err) {
        alert('Erro ao adicionar ativo.');
      } finally {
        setSalvandoTicker(null);
      }
    } else if (onCadastrarAtivo) {
      onCadastrarAtivo({
        ticker: item.ticker,
        nome: item.nome,
        tipo: item.tipo,
        setor: item.setor,
        precoAtual: item.precoAtual,
        dividendYield: item.dividendYield,
      });
    }
  };

  const ranking = useMemo(() => {
    return getPerformanceRanking(periodo, filtroTipo, ativos);
  }, [periodo, filtroTipo, ativos]);

  const periodosInfo: { id: PeriodoPerformance; label: string; descricao: string }[] = [
    { id: '1D', label: 'No Dia (1D)', descricao: 'Pregão de hoje' },
    { id: '7D', label: '7 Dias (Semanal)', descricao: 'Última semana' },
    { id: '15D', label: '15 Dias (Quinzenal)', descricao: 'Últimos 15 dias' },
  ];

  const getMedalhaColor = (posicao: number, isAlta: boolean) => {
    if (isAlta) {
      if (posicao === 1) return 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30';
      if (posicao === 2) return 'bg-slate-300 text-slate-900 font-bold';
      if (posicao === 3) return 'bg-amber-700 text-amber-100 font-bold';
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold';
    } else {
      if (posicao === 1) return 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/30';
      if (posicao === 2) return 'bg-rose-600/80 text-rose-100 font-bold';
      if (posicao === 3) return 'bg-rose-700/80 text-rose-100 font-bold';
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Seletor de Períodos e Filtro */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950">
              <Award className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Top 7 Maiores Altas & Baixas
            </h2>
            {onAtualizarPrecos && (
              <button
                onClick={onAtualizarPrecos}
                className={`p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition ${carregandoPrecos ? 'animate-spin' : ''}`}
                title="Atualizar cotações em tempo real"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe em tempo real os 7 ativos que mais renderam e os 7 que menos performaram na bolsa brasileira (B3).
          </p>
        </div>

        {/* Controles de Período e Tipo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Seletor de Período: 1D, 7D, 15D */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            {periodosInfo.map((p) => {
              const active = periodo === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filtro de Tipo: Todos, Ações, FIIs */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                filtroTipo === 'TODOS'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('Acao')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                filtroTipo === 'Acao'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ações
            </button>
            <button
              onClick={() => setFiltroTipo('FII')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                filtroTipo === 'FII'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FIIs
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE BUSCA & INCLUSÃO DE ATIVOS NA BASE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Search className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Pesquisar Ativo (Ações & FIIs)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 hidden sm:inline-block">
                  B3 & Catálogo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Consulte cotações de ações e fundos imobiliários e adicione à sua base se desejar.
              </p>
            </div>
          </div>

          {onCadastrarAtivo && (
            <button
              onClick={() => onCadastrarAtivo()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Cadastrar Novo Ativo</span>
            </button>
          )}
        </div>

        {/* Notificação de Sucesso */}
        {sucessoMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Barra de Pesquisa e Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Digite o ticker ou nome (ex: PETR4, MXRF11, KNRI11, BBSE3, WEGE3)..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-medium"
            />
            {termoPesquisa && (
              <button
                onClick={() => setTermoPesquisa('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setFiltroTipoPesquisa('TODOS')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filtroTipoPesquisa === 'TODOS'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipoPesquisa('Acao')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filtroTipoPesquisa === 'Acao'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ações
            </button>
            <button
              onClick={() => setFiltroTipoPesquisa('FII')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filtroTipoPesquisa === 'FII'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FIIs
            </button>
          </div>
        </div>

        {/* Sugestões Rápidas quando campo estiver vazio */}
        {!termoPesquisa && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Sugestões rápidas:</span>
            {['PETR4', 'VALE3', 'MXRF11', 'HGLG11', 'BBSE3', 'KNRI11', 'WEGE3', 'XPML11', 'TAEE11', 'EGIE3'].map((t) => (
              <button
                key={`sug-${t}`}
                onClick={() => setTermoPesquisa(t)}
                className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 font-mono text-[11px] font-semibold border border-slate-800/80 transition"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Painel de Resultados da Busca */}
        {termoPesquisa.trim() !== '' && (
          <div className="pt-2 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
              <span>
                {resultadosBusca.length}{' '}
                {resultadosBusca.length === 1 ? 'ativo encontrado' : 'ativos encontrados'} para "
                <strong className="text-slate-200">{termoPesquisa}</strong>"
              </span>
              <button
                onClick={() => setTermoPesquisa('')}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Fechar resultados
              </button>
            </div>

            {resultadosBusca.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  Nenhum ativo pré-configurado encontrado para "<strong>{termoPesquisa}</strong>".
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Você pode cadastrar este ativo com suas próprias informações na base agora mesmo.
                </p>
                {onCadastrarAtivo && (
                  <button
                    onClick={() =>
                      onCadastrarAtivo({
                        ticker: termoPesquisa.trim().toUpperCase(),
                        tipo: termoPesquisa.trim().endsWith('11') ? 'FII' : 'Acao',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar "{termoPesquisa.trim().toUpperCase()}" na Base</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {resultadosBusca.map((item) => {
                  const isFII = item.tipo === 'FII';
                  const isFav = favoritos.includes(item.ticker.toUpperCase());

                  return (
                    <div
                      key={`pesq-${item.ticker}`}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black font-mono text-slate-100 group-hover:text-emerald-400 transition">
                              {item.ticker}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isFII
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {item.tipo}
                            </span>
                            {item.jaCadastrado ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Na sua Base
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Catálogo B3
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs text-slate-300 font-medium mt-1 line-clamp-1">{item.nome}</h4>
                          <p className="text-[11px] text-slate-500">{item.setor || 'Diversificado'}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-100 font-mono block">
                            {item.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono font-semibold">
                            DY {item.dividendYield.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                        {item.jaCadastrado ? (
                          <div className="flex items-center gap-2 w-full justify-between">
                            <button
                              onClick={() => onSelectAtivo(item.ativoCadastrado!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-semibold border border-slate-700/80 transition"
                            >
                              <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Ver Gráfico (1D a 5A)</span>
                            </button>

                            <button
                              onClick={() => onToggleFavorito(item.ticker)}
                              className={`p-1.5 rounded-xl border transition ${
                                isFav
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-900 text-slate-500 hover:text-slate-300 border-slate-800'
                              }`}
                              title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full justify-end">
                            {onCadastrarAtivo && (
                              <button
                                onClick={() =>
                                  onCadastrarAtivo({
                                    ticker: item.ticker,
                                    nome: item.nome,
                                    tipo: item.tipo,
                                    setor: item.setor,
                                    precoAtual: item.precoAtual,
                                    dividendYield: item.dividendYield,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
                                title="Editar dados antes de cadastrar"
                              >
                                Revisar
                              </button>
                            )}

                            <button
                              disabled={salvandoTicker === item.ticker}
                              onClick={() => handleAdicionarAtivoBase(item)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {salvandoTicker === item.ticker ? 'Salvando...' : '+ Adicionar à Base'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Grade Principal: Duas Colunas com Top 7 Altas e Top 7 Baixas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA 1: TOP 7 QUE MAIS RENDERAM (MAIORES ALTAS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <span>🚀 Top 7 Que Mais Renderam</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Altas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Maiores valorizações acumuladas no período de {periodo}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {ranking.top7Altas.map((item) => {
              const fav = favoritos.includes(item.ticker.toUpperCase());
              const isFII = item.tipo === 'FII';
              const maxVal = ranking.destaqueAlta?.variacaoPercentual || 1;
              const barraWidth = Math.min(100, Math.max(10, (item.variacaoPercentual / maxVal) * 100));

              return (
                <div
                  key={`alta-${item.ticker}`}
                  onClick={() => onSelectAtivo(item.ativo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAtivo(item.ativo);
                    }
                  }}
                  className="cursor-pointer bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/60 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-[0.99] rounded-2xl p-3.5 transition-all group flex flex-col gap-2"
                  title={`Clique para abrir informações completas e fundamentos de ${item.ticker}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Posição + Ticker + Detalhes */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${getMedalhaColor(
                          item.posicao,
                          true
                        )}`}
                      >
                        {item.posicao}º
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm sm:text-base text-slate-100 font-mono group-hover:text-emerald-400 transition flex items-center gap-1 text-left">
                            <span>{item.ticker}</span>
                            <LineChart className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isFII
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] sm:max-w-xs">
                          {item.nome}
                        </p>
                      </div>
                    </div>

                    {/* Preço e Variação + Ação */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-emerald-400 font-mono block">
                          +{item.variacaoPercentual.toFixed(2)}%
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      {/* Botão de Favoritar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorito(item.ticker);
                        }}
                        className={`p-1.5 rounded-lg border transition ${
                          fav
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
                        }`}
                        title={fav ? 'Remover dos favoritos' : 'Favoritar ativo'}
                      >
                        <Star className={`w-3.5 h-3.5 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Barra Visual de Intensidade */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barraWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: TOP 7 QUE MENOS PERFORMARAM (MAIORES BAIXAS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <span>🔻 Top 7 Menor Performance</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                    Baixas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Ativos com menor rendimento no período de {periodo}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {ranking.top7Baixas.map((item) => {
              const fav = favoritos.includes(item.ticker.toUpperCase());
              const isFII = item.tipo === 'FII';
              const minVal = Math.abs(ranking.destaqueBaixa?.variacaoPercentual || 1);
              const barraWidth = Math.min(100, Math.max(10, (Math.abs(item.variacaoPercentual) / minVal) * 100));

              return (
                <div
                  key={`baixa-${item.ticker}`}
                  onClick={() => onSelectAtivo(item.ativo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAtivo(item.ativo);
                    }
                  }}
                  className="cursor-pointer bg-slate-950/70 border border-slate-800/80 hover:border-rose-500/60 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-rose-950/20 active:scale-[0.99] rounded-2xl p-3.5 transition-all group flex flex-col gap-2"
                  title={`Clique para abrir informações completas e fundamentos de ${item.ticker}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Posição + Ticker + Detalhes */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${getMedalhaColor(
                          item.posicao,
                          false
                        )}`}
                      >
                        {item.posicao}º
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm sm:text-base text-slate-100 font-mono group-hover:text-rose-400 transition flex items-center gap-1 text-left">
                            <span>{item.ticker}</span>
                            <LineChart className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 opacity-0 group-hover:opacity-100 transition" />
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isFII
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] sm:max-w-xs">
                          {item.nome}
                        </p>
                      </div>
                    </div>

                    {/* Preço e Variação + Ação */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-rose-400 font-mono block">
                          {item.variacaoPercentual.toFixed(2)}%
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      {/* Botão de Favoritar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorito(item.ticker);
                        }}
                        className={`p-1.5 rounded-lg border transition ${
                          fav
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
                        }`}
                        title={fav ? 'Remover dos favoritos' : 'Favoritar ativo'}
                      >
                        <Star className={`w-3.5 h-3.5 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Barra Visual de Intensidade de Baixa */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-600 to-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barraWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
