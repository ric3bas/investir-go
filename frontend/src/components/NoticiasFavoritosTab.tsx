import React, { useState, useMemo } from 'react';
import { Ativo, NoticiaAtivo, CategoriaNoticia } from '../types';
import { NOTICIAS_MERCADO } from '../utils/marketData';
import {
  Newspaper,
  Star,
  Plus,
  Search,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  LineChart,
  Tag,
  ChevronRight,
  BookmarkCheck,
  Building2
} from 'lucide-react';

interface NoticiasFavoritosTabProps {
  ativos: Ativo[];
  favoritos: string[];
  onToggleFavorito: (ticker: string) => void;
  onSelectAtivo: (ativo: Ativo) => void;
}

export const NoticiasFavoritosTab: React.FC<NoticiasFavoritosTabProps> = ({
  ativos,
  favoritos,
  onToggleFavorito,
  onSelectAtivo,
}) => {
  const [tickerFiltro, setTickerFiltro] = useState<string>('FAVORITOS');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [modalNoticiaAberta, setModalNoticiaAberta] = useState<NoticiaAtivo | null>(null);
  const [seletorAberto, setSeletorAberto] = useState<boolean>(false);

  // Mapear ativos para busca rápida
  const ativosMap = useMemo(() => {
    const map = new Map<string, Ativo>();
    ativos.forEach((a) => map.set(a.ticker.toUpperCase(), a));
    return map;
  }, [ativos]);

  // Lista dos ativos favoritados
  const ativosFavoritados = useMemo(() => {
    return favoritos
      .map((t) => ativosMap.get(t.toUpperCase()))
      .filter((a): a is Ativo => a !== undefined);
  }, [favoritos, ativosMap]);

  // Estatísticas do dia dos favoritos
  const statsFavoritos = useMemo(() => {
    if (ativosFavoritados.length === 0) return { altas: 0, baixas: 0, mediaDia: 0 };
    const altas = ativosFavoritados.filter((a) => a.variacaoDia >= 0).length;
    const baixas = ativosFavoritados.filter((a) => a.variacaoDia < 0).length;
    const soma = ativosFavoritados.reduce((acc, a) => acc + a.variacaoDia, 0);
    const mediaDia = soma / ativosFavoritados.length;
    return { altas, baixas, mediaDia };
  }, [ativosFavoritados]);

  // Filtragem das notícias
  const noticiasFiltradas = useMemo(() => {
    return NOTICIAS_MERCADO.filter((noticia) => {
      // Filtro de Ticker / Favoritos
      if (tickerFiltro === 'FAVORITOS') {
        const matchesTicker = favoritos.includes(noticia.ticker.toUpperCase());
        const matchesRelacionados = noticia.tickersRelacionados?.some((t) =>
          favoritos.includes(t.toUpperCase())
        );
        if (favoritos.length > 0 && !matchesTicker && !matchesRelacionados) {
          return false;
        }
      } else if (tickerFiltro !== 'TODOS') {
        const matchesTicker = noticia.ticker.toUpperCase() === tickerFiltro.toUpperCase();
        const matchesRelacionados = noticia.tickersRelacionados?.some(
          (t) => t.toUpperCase() === tickerFiltro.toUpperCase()
        );
        if (!matchesTicker && !matchesRelacionados) return false;
      }

      // Filtro de Categoria
      if (categoriaFiltro !== 'TODAS' && noticia.categoria !== categoriaFiltro) {
        return false;
      }

      // Busca por texto
      if (termoBusca.trim() !== '') {
        const termo = termoBusca.toLowerCase();
        const matchTitulo = noticia.titulo.toLowerCase().includes(termo);
        const matchResumo = noticia.resumo.toLowerCase().includes(termo);
        const matchFonte = noticia.fonte.toLowerCase().includes(termo);
        const matchTicker = noticia.ticker.toLowerCase().includes(termo);
        if (!matchTitulo && !matchResumo && !matchFonte && !matchTicker) return false;
      }

      return true;
    });
  }, [tickerFiltro, categoriaFiltro, termoBusca, favoritos]);

  const categoriasDisponiveis = ['TODAS', 'Proventos', 'Fato Relevante', 'Resultado', 'Analise'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950">
              <Newspaper className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Acompanhamento Diário & Notícias dos Favoritos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mantenha-se informado sobre dividendos, fatos relevantes e oscilações dos seus ativos preferidos da B3.
          </p>
        </div>

        {/* Botão de Adicionar Mais Favoritos */}
        <button
          onClick={() => setSeletorAberto(!seletorAberto)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{seletorAberto ? 'Fechar Catálogo' : 'Gerenciar Favoritos'}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono text-[10px] font-bold">
            {favoritos.length}
          </span>
        </button>
      </div>

      {/* Gaveta de Gerenciamento de Favoritos */}
      {seletorAberto && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">
                Selecione os ativos que deseja acompanhar diariamente:
              </h4>
            </div>
            <span className="text-xs text-slate-400">{favoritos.length} de {ativos.length} selecionados</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {ativos.map((ativo) => {
              const isFav = favoritos.includes(ativo.ticker.toUpperCase());
              return (
                <button
                  key={ativo.id}
                  onClick={() => onToggleFavorito(ativo.ticker)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                    isFav
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                  <span>{ativo.ticker}</span>
                  <span className="text-[10px] opacity-70">
                    {ativo.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 1: CARROSSEL DE CARDS DOS ATIVOS FAVORITOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
              Meus Ativos Favoritos ({ativosFavoritados.length})
            </h3>
          </div>

          {ativosFavoritados.length > 0 && (
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                {statsFavoritos.altas} em alta
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <TrendingDown className="w-3.5 h-3.5" />
                {statsFavoritos.baixas} em baixa
              </span>
              <span className="text-slate-400 font-mono">
                Média do dia:{' '}
                <strong className={statsFavoritos.mediaDia >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {statsFavoritos.mediaDia >= 0 ? '+' : ''}
                  {statsFavoritos.mediaDia.toFixed(2)}%
                </strong>
              </span>
            </div>
          )}
        </div>

        {ativosFavoritados.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-200">Você ainda não favoritou nenhum ativo</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Favorite seus ativos prediletos para filtrar automaticamente as notícias diárias e acompanhar cotações rápidas.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs text-slate-500">Sugestões populares:</span>
              {['PETR4', 'VALE3', 'BBAS3', 'MXRF11', 'WEGE3'].map((t) => (
                <button
                  key={t}
                  onClick={() => onToggleFavorito(t)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700 transition"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {ativosFavoritados.map((ativo) => {
              const isFII = ativo.tipo === 'FII';
              const isAlta = ativo.variacaoDia >= 0;

              return (
                <div
                  key={ativo.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectAtivo(ativo)}
                          className="font-extrabold text-base text-slate-100 font-mono hover:text-amber-400 transition"
                          title="Clique para abrir histórico de 5 anos com gráfico"
                        >
                          {ativo.ticker}
                        </button>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isFII
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {ativo.tipo}
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleFavorito(ativo.ticker)}
                        className="text-amber-400 hover:text-slate-400 transition"
                        title="Remover dos favoritos"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ativo.nome}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-semibold block">Cotação</span>
                      <span className="text-sm font-bold text-slate-100 font-mono">
                        {ativo.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          isAlta ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {isAlta ? '+' : ''}
                        {ativo.variacaoDia.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Ação rápida para abrir gráfico de até 5 anos */}
                  <button
                    onClick={() => onSelectAtivo(ativo)}
                    className="w-full mt-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Ver Gráfico 5 Anos</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: FEED DE NOTÍCIAS COM FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-400" />
              <span>Notícias & Fatos Relevantes Recentes</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtradas para o acompanhamento diário dos seus ativos favoritos.
            </p>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar em notícias..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filtros em Abas / Chips */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          {/* Filtro por Ativo / Favoritos */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Filtrar por:</span>

            <button
              onClick={() => setTickerFiltro('FAVORITOS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                tickerFiltro === 'FAVORITOS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Meus Favoritos ({favoritos.length})</span>
            </button>

            <button
              onClick={() => setTickerFiltro('TODOS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                tickerFiltro === 'TODOS'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todas as Notícias (Bolsa Geral)
            </button>

            {/* Chips individuais para cada favorito */}
            {favoritos.map((fav) => (
              <button
                key={`chip-${fav}`}
                onClick={() => setTickerFiltro(fav)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  tickerFiltro === fav
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {fav}
              </button>
            ))}
          </div>

          {/* Filtro por Categoria */}
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs self-start sm:self-auto">
            {categoriasDisponiveis.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-2.5 py-1 rounded-md transition ${
                  categoriaFiltro === cat
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'TODAS' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Notícias */}
        <div className="space-y-3 pt-2">
          {noticiasFiltradas.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Newspaper className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm">Nenhuma notícia encontrada com os filtros selecionados.</p>
              <button
                onClick={() => {
                  setTickerFiltro('TODOS');
                  setCategoriaFiltro('TODAS');
                  setTermoBusca('');
                }}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            noticiasFiltradas.map((noticia) => {
              const ativoVinculado = ativosMap.get(noticia.ticker.toUpperCase());
              const isFav = favoritos.includes(noticia.ticker.toUpperCase());

              const getSentimentoBadge = (sentimento: string) => {
                if (sentimento === 'Positivo') {
                  return (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Positivo
                    </span>
                  );
                }
                if (sentimento === 'Atencao') {
                  return (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Atenção
                    </span>
                  );
                }
                return (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Neutro
                  </span>
                );
              };

              return (
                <div
                  key={noticia.id}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition space-y-3 group"
                >
                  {/* Linha Superior: Ticker + Categoria + Sentimento + Tempo */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Ticker Tag clicável */}
                      <button
                        onClick={() => ativoVinculado && onSelectAtivo(ativoVinculado)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-100 hover:text-emerald-400 transition flex items-center gap-1 shadow-sm"
                        title="Ver histórico e gráfico deste ativo"
                      >
                        {isFav && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                        <span>{noticia.ticker}</span>
                        <LineChart className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </button>

                      {/* Tickers Relacionados */}
                      {noticia.tickersRelacionados?.map((rel) => {
                        const ativoRel = ativosMap.get(rel.toUpperCase());
                        return (
                          <button
                            key={rel}
                            onClick={() => ativoRel && onSelectAtivo(ativoRel)}
                            className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 transition"
                          >
                            +{rel}
                          </button>
                        );
                      })}

                      {/* Categoria */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                        {noticia.categoria}
                      </span>

                      {/* Sentimento */}
                      {getSentimentoBadge(noticia.sentimento)}
                    </div>

                    {/* Metadata de Fonte e Tempo */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-400">{noticia.fonte}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {noticia.dataPublicacao}
                      </span>
                    </div>
                  </div>

                  {/* Título e Resumo */}
                  <div>
                    <h4
                      onClick={() => setModalNoticiaAberta(noticia)}
                      className="text-sm sm:text-base font-bold text-slate-100 hover:text-emerald-400 cursor-pointer transition leading-snug"
                    >
                      {noticia.titulo}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {noticia.resumo}
                    </p>
                  </div>

                  {/* Ações da Notícia */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <button
                      onClick={() => setModalNoticiaAberta(noticia)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                    >
                      <span>Ler análise completa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {ativoVinculado && (
                      <button
                        onClick={() => onSelectAtivo(ativoVinculado)}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px] transition"
                      >
                        <span>Cotação atual: {ativoVinculado.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Leitura Detalhada da Notícia */}
      {modalNoticiaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {modalNoticiaAberta.ticker}
                </span>
                <span className="text-xs text-slate-400">• {modalNoticiaAberta.categoria}</span>
                <span className="text-xs text-slate-500">• {modalNoticiaAberta.dataPublicacao}</span>
              </div>
              <button
                onClick={() => setModalNoticiaAberta(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-100">{modalNoticiaAberta.titulo}</h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
              <p>{modalNoticiaAberta.resumo}</p>
              <p className="text-slate-400">
                Os dados financeiros e comunicados ao mercado são monitorados em conformidade com as diretrizes da B3 e da Comissão de Valores Mobiliários (CVM).
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Fonte: {modalNoticiaAberta.fonte}</span>
              <div className="flex items-center gap-2">
                {ativosMap.get(modalNoticiaAberta.ticker.toUpperCase()) && (
                  <button
                    onClick={() => {
                      const at = ativosMap.get(modalNoticiaAberta.ticker.toUpperCase());
                      setModalNoticiaAberta(null);
                      if (at) onSelectAtivo(at);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                  >
                    Ver Gráfico 5 Anos de {modalNoticiaAberta.ticker}
                  </button>
                )}
                <button
                  onClick={() => setModalNoticiaAberta(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
