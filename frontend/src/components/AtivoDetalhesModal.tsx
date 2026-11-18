import React, { useState, useMemo, useEffect } from 'react';
import { Ativo, PeriodoHistorico } from '../types';
import { getHistoricoAtivo, NOTICIAS_MERCADO } from '../utils/marketData';
import { getInformacoesEmpresa } from '../utils/empresaData';
import {
  X,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  Newspaper,
  Calendar,
  Percent,
  DollarSign,
  BarChart2,
  Activity,
  Building2,
  ShieldCheck,
  PieChart,
  Coins,
  Scale,
  Award,
  CheckCircle2,
  Briefcase,
  MapPin,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface AtivoDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ativo: Ativo | null;
  isFavorito: boolean;
  onToggleFavorito: (ticker: string) => void;
  onOpenNovaOperacao?: (ticker: string, tipo?: 'COMPRA' | 'VENDA') => void;
  onNavigateToNoticias?: (ticker: string) => void;
}

export const AtivoDetalhesModal: React.FC<AtivoDetalhesModalProps> = ({
  isOpen,
  onClose,
  ativo,
  isFavorito,
  onToggleFavorito,
  onOpenNovaOperacao,
  onNavigateToNoticias,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'empresa' | 'grafico'>('grafico');
  const [periodo, setPeriodo] = useState<PeriodoHistorico>('1D');

  // Abre sempre na aba de gráfico por padrão e período 1D
  useEffect(() => {
    if (isOpen) {
      setAbaAtiva('grafico');
      setPeriodo('1D');
    }
  }, [isOpen, ativo?.ticker]);

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

  const periodosDisponiveis: { id: PeriodoHistorico; label: string; sub: string }[] = [
    { id: '1D', label: '1D', sub: 'Hoje' },
    { id: '7D', label: '7D', sub: '7 dias' },
    { id: '15D', label: '15D', sub: '15 dias' },
    { id: '1M', label: '1M', sub: '1 mês' },
    { id: '6M', label: '6M', sub: '6 meses' },
    { id: '1A', label: '1A', sub: '1 ano' },
    { id: '2A', label: '2A', sub: '2 anos' },
    { id: '5A', label: '5A', sub: '5 anos' },
  ];

  const historico = useMemo(() => {
    if (!ativo) return null;
    return getHistoricoAtivo(ativo.ticker, periodo, ativo.precoAtual);
  }, [ativo, periodo]);

  const infoEmpresa = useMemo(() => {
    if (!ativo) return null;
    return getInformacoesEmpresa(ativo);
  }, [ativo]);

  const noticiasDoAtivo = useMemo(() => {
    if (!ativo) return [];
    const t = ativo.ticker.toUpperCase();
    return NOTICIAS_MERCADO.filter(
      (n) => n.ticker.toUpperCase() === t || n.tickersRelacionados?.some((r) => r.toUpperCase() === t)
    );
  }, [ativo]);

  if (!isOpen || !ativo || !historico || !infoEmpresa) return null;

  const isAlta = historico.variacaoPercentual >= 0;
  const isFII = ativo.tipo === 'FII';

  const periodoDescricao: Record<PeriodoHistorico, string> = {
    '1D': 'no dia de hoje',
    '7D': 'nos últimos 7 dias',
    '15D': 'nos últimos 15 dias',
    '1M': 'no último mês',
    '6M': 'nos últimos 6 meses',
    '1A': 'no último ano',
    '2A': 'nos últimos 2 anos',
    '5A': 'nos últimos 5 anos',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header Superior do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg font-mono shadow-inner ${
                isFII
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {ativo.ticker.substring(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">
                  {ativo.ticker}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isFII
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {ativo.tipo}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-slate-400 hidden sm:inline">{ativo.setor || 'Diversificado'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ativo.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Favoritar */}
            <button
              onClick={() => onToggleFavorito(ativo.ticker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isFavorito
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star className={`w-4 h-4 ${isFavorito ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isFavorito ? 'Favoritado' : 'Favoritar'}</span>
            </button>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumo Rápido de Cotação Fixado */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-slate-100 font-mono">
              {ativo.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                ativo.variacaoDia >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}
            >
              {ativo.variacaoDia >= 0 ? '+' : ''}
              {ativo.variacaoDia.toFixed(2)}% no dia
            </span>
            <span className="text-xs text-amber-400 font-mono font-semibold ml-2">
              DY: {ativo.dividendYield.toFixed(2)}% a.a.
            </span>
          </div>

          {/* Abas de Navegação Interna */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setAbaAtiva('empresa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                abaAtiva === 'empresa'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Sobre a Empresa & Fundamentos</span>
            </button>

            <button
              onClick={() => setAbaAtiva('grafico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                abaAtiva === 'grafico'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Gráficos & Cotação</span>
            </button>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* ======================================================= */}
          {/* ABA 1: INFORMAÇÕES RELEVANTES DA EMPRESA & FUNDAMENTOS  */}
          {/* ======================================================= */}
          {abaAtiva === 'empresa' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Sobre a Empresa e Modelo de Negócio */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                  <h4 className="font-extrabold text-base text-slate-100">
                    {isFII ? 'Tese & Perfil do Fundo Imobiliário' : 'Perfil Institucional & Atuação da Empresa'}
                  </h4>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {infoEmpresa.descricao}
                </p>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {isFII ? 'Estratégia de Alocação de Recursos:' : 'Modelo de Negócio e Geração de Receita:'}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {infoEmpresa.modeloNegocio}
                  </p>
                </div>
              </div>

              {/* Destaques Operacionais */}
              {infoEmpresa.destaquesOperacionais && infoEmpresa.destaquesOperacionais.length > 0 && (
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                      Destaques Operacionais e Estratégicos
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {infoEmpresa.destaquesOperacionais.map((dest, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{dest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados Corporativos e Governança */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="font-extrabold text-base text-slate-100">
                    Governança Corporativa & Dados Cadastrais
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Razão Social</span>
                    <span className="text-xs font-semibold text-slate-200 block mt-1 truncate" title={infoEmpresa.razaoSocial}>
                      {infoEmpresa.razaoSocial}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">CNPJ</span>
                    <span className="text-xs font-mono font-semibold text-slate-200 block mt-1">
                      {infoEmpresa.cnpj}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Segmento de Listagem</span>
                    <span className="text-xs font-semibold text-emerald-400 block mt-1">
                      {infoEmpresa.governanca}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tag Along (Proteção)</span>
                    <span className="text-xs font-bold text-slate-200 block mt-1">
                      {infoEmpresa.tagAlong}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Free Float (Circulação)</span>
                    <span className="text-xs font-bold text-slate-200 block mt-1">
                      {infoEmpresa.freeFloat}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sede & Fundação</span>
                    <span className="text-xs text-slate-300 block mt-1 truncate">
                      {infoEmpresa.sede} • {infoEmpresa.fundacao}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicadores Fundamentalistas */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Activity className="w-5 h-5" />
                    <h4 className="font-extrabold text-base text-slate-100">
                      {isFII ? 'Métricas & Indicadores do Fundo Imobiliário' : 'Indicadores Fundamentalistas Chave'}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">B3 / CVM</span>
                </div>

                {isFII ? (
                  // Indicadores para FIIs
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">P/VP (Preço/Valor Patrimonial)</span>
                      <span className="text-lg font-black text-slate-100 font-mono mt-1 block">
                        {infoEmpresa.indicadores.pvp.toFixed(2)}x
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {infoEmpresa.indicadores.pvp < 1 ? 'Negociando com desconto' : 'Com ágio sobre VP'}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dividend Yield Anual</span>
                      <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
                        {infoEmpresa.indicadores.dividendYield.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Isento de IRPF</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">VP por Cota</span>
                      <span className="text-lg font-black text-slate-100 font-mono mt-1 block">
                        {(infoEmpresa.indicadores.valorPatrimonialCota || ativo.precoAtual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Valor Patrimonial Real</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Último Rendimento</span>
                      <span className="text-lg font-black text-amber-400 font-mono mt-1 block">
                        {(infoEmpresa.indicadores.ultimoRendimento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Rendimento/cota no mês</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Vacância Física</span>
                      <span className="text-lg font-black text-slate-200 font-mono mt-1 block">
                        {infoEmpresa.indicadores.vacanciaFisica !== undefined ? `${infoEmpresa.indicadores.vacanciaFisica}%` : '0%'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Área Desocupada</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Qtd. de Imóveis/Ativos</span>
                      <span className="text-lg font-black text-slate-200 font-mono mt-1 block">
                        {infoEmpresa.indicadores.quantidadeImoveis || (ativo.setor?.includes('Papel') ? 'CRIs múltiplos' : 'Diversos')}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Portfólio Imobiliário</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Gestão & Administração</span>
                      <span className="text-xs font-semibold text-slate-200 mt-1 block truncate">
                        Gestor: {infoEmpresa.indicadores.gestor || 'Gestora Habilitada'}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        Admin: {infoEmpresa.indicadores.administrador || 'Administrador B3'}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Indicadores para Ações
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">P/L (Preço / Lucro)</span>
                      <span className="text-lg font-black text-slate-100 font-mono mt-1 block">
                        {infoEmpresa.indicadores.pl ? `${infoEmpresa.indicadores.pl.toFixed(1)}x` : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Anos p/ retorno em lucro</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">P/VP (Preço / Valor Patr.)</span>
                      <span className="text-lg font-black text-slate-100 font-mono mt-1 block">
                        {infoEmpresa.indicadores.pvp.toFixed(2)}x
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Multiplicador de patrimônio</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">ROE (Rentab. Patrimônio)</span>
                      <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
                        {infoEmpresa.indicadores.roe ? `${infoEmpresa.indicadores.roe.toFixed(1)}%` : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Eficiência do capital</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dividend Yield (DY)</span>
                      <span className="text-lg font-black text-amber-400 font-mono mt-1 block">
                        {infoEmpresa.indicadores.dividendYield.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Retorno em proventos a.a.</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">ROIC</span>
                      <span className="text-lg font-black text-slate-200 font-mono mt-1 block">
                        {infoEmpresa.indicadores.roic ? `${infoEmpresa.indicadores.roic.toFixed(1)}%` : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Retorno do capital investido</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Margem Líquida</span>
                      <span className="text-lg font-black text-slate-200 font-mono mt-1 block">
                        {infoEmpresa.indicadores.margemLiquida ? `${infoEmpresa.indicadores.margemLiquida.toFixed(1)}%` : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Lucro líquido s/ receita</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Margem EBITDA</span>
                      <span className="text-lg font-black text-slate-200 font-mono mt-1 block">
                        {infoEmpresa.indicadores.margemEbitda ? `${infoEmpresa.indicadores.margemEbitda.toFixed(1)}%` : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Eficiência operacional</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dívida Líq / EBITDA</span>
                      <span className="text-lg font-black text-slate-200 font-mono mt-1 block">
                        {infoEmpresa.indicadores.dividaLiquidaEbitda !== undefined
                          ? `${infoEmpresa.indicadores.dividaLiquidaEbitda.toFixed(2)}x`
                          : '-'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Alavancagem financeira</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* ABA 2: GRÁFICOS & EVOLUÇÃO HISTÓRICA (1D A 5 ANOS)      */}
          {/* ======================================================= */}
          {abaAtiva === 'grafico' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Performance no Período Selecionado (Subiu ou Caiu) */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isAlta
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAlta ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                    }`}
                  >
                    {isAlta ? <TrendingUp className="w-7 h-7 stroke-[2.5]" /> : <TrendingDown className="w-7 h-7 stroke-[2.5]" />}
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wide opacity-80 block">
                      {isAlta ? 'Valorização no período' : 'Desvalorização no período'} ({periodo})
                    </span>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-2xl font-black">
                        {isAlta ? '+' : ''}
                        {historico.variacaoPercentual.toFixed(2)}%
                      </span>
                      <span className="text-sm font-semibold opacity-90">
                        ({isAlta ? '+' : ''}
                        {historico.variacaoReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-400 block">Variação acumulada</span>
                  <span className="text-xs font-semibold text-slate-200">{periodoDescricao[periodo]}</span>
                </div>
              </div>

              {/* Seletor de Períodos (Tabs) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-300">Janela de Tempo:</span>
                  <span className="text-slate-500">Selecione até 5 anos com gráfico</span>
                </div>

                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 overflow-x-auto no-scrollbar">
                  {periodosDisponiveis.map((p) => {
                    const isActive = periodo === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPeriodo(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico Interativo com Recharts */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium">
                      Evolução do Preço da Cotação — Período de {periodo} ({historico.pontos.length} amostras)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-slate-500">
                      Início: <strong className="text-slate-300">{historico.precoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </span>
                    <span className="text-slate-500">
                      Final: <strong className="text-slate-300">{historico.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </span>
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historico.pontos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGradientVerde" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="areaGradientVermelho" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                      <XAxis
                        dataKey="data"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#334155' }}
                      />

                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#334155' }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tickFormatter={(val) => `R$ ${val.toFixed(0)}`}
                      />

                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const varPonto = data.variacaoPeriodo;
                            const isPontoAlta = varPonto >= 0;
                            return (
                              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
                                <p className="text-slate-400 font-medium">{data.dataCompleta}</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-slate-400">Preço:</span>
                                  <span className="text-base font-extrabold text-slate-100 font-mono">
                                    {data.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 font-mono">
                                  <span className="text-slate-400">Var. acumulada:</span>
                                  <span className={`font-bold ${isPontoAlta ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPontoAlta ? '+' : ''}
                                    {varPonto.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="preco"
                        stroke={isAlta ? '#10b981' : '#f43f5e'}
                        strokeWidth={2.5}
                        fill={isAlta ? 'url(#areaGradientVerde)' : 'url(#areaGradientVermelho)'}
                        dot={historico.pontos.length <= 15 ? { r: 3, fill: isAlta ? '#10b981' : '#f43f5e' } : false}
                        activeDot={{ r: 6, fill: isAlta ? '#10b981' : '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cards com Estatísticas do Período */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mínima do Período</span>
                  <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                    {historico.minima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Máxima do Período</span>
                  <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                    {historico.maxima.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Preço Médio Período</span>
                  <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                    {historico.precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Dividend Yield Atual</span>
                  <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                    {ativo.dividendYield > 0 ? `${ativo.dividendYield.toFixed(2)}% a.a.` : '0.00%'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé de Ações Rápidas */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Dados de cotação e perfil corporativo atualizados para {ativo.ticker}</span>
          </div>
          {onOpenNovaOperacao && (
            <button
              onClick={() => {
                onClose();
                onOpenNovaOperacao(ativo.ticker, 'COMPRA');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Comprar {ativo.ticker}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
