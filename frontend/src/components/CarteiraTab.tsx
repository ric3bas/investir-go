import React, { useState } from 'react';
import { AtualizacaoCotacoes, PosicaoCarteira } from '../types';
import { Plus, Minus, Coins, Search, LineChart, ArrowDownUp, Eye, EyeOff, RefreshCw, FileSpreadsheet, SlidersHorizontal, ArrowDownWideNarrow } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';
import { formatarDinheiro } from '../utils/formatters';

interface CarteiraTabProps {
  posicoes: PosicaoCarteira[];
  totalLancamentos?: number;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
  onOpenLancamentos: () => void;
  onOpenImportacaoB3: () => void;
  onSelectTicker?: (ticker: string) => void;
  onAtualizarPrecos?: () => Promise<AtualizacaoCotacoes>;
  carregandoPrecos?: boolean;
}

export const CarteiraTab: React.FC<CarteiraTabProps> = ({
  posicoes,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onOpenLancamentos,
  onOpenImportacaoB3,
  onSelectTicker,
  onAtualizarPrecos,
  carregandoPrecos,
}) => {
  const { esconderValores, toggleEsconderValores, formatarValor } = usePrivacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'Acao' | 'FII'>('TODOS');
  const [ordenacao, setOrdenacao] = useState<'saldo' | 'rentabilidade' | 'ticker'>('saldo');
  const [retornoAtualizacao, setRetornoAtualizacao] = useState<{ erro: boolean; mensagem: string } | null>(null);

  const atualizarCotacoes = async () => {
    if (!onAtualizarPrecos || carregandoPrecos) return;
    setRetornoAtualizacao(null);
    try {
      const resultado = await onAtualizarPrecos();
      const mensagem = resultado.falhas.length > 0
        ? `${resultado.atualizados} de ${resultado.totalConsultados} cotações atualizadas. Falha em: ${resultado.falhas.join(', ')}.`
        : `${resultado.atualizados} cotações atualizadas com sucesso.`;
      setRetornoAtualizacao({ erro: resultado.falhas.length > 0, mensagem });
    } catch {
      setRetornoAtualizacao({
        erro: true,
        mensagem: 'Não foi possível consultar o mercado agora. Os preços anteriores foram preservados.'
      });
    }
  };

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

      {/* Cabeçalho e ações da carteira */}
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
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

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center xl:justify-end" aria-label="Ações da carteira">
          <button
            onClick={() => onOpenNovaOperacao()}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Operação
          </button>
          <button
            onClick={() => onOpenNovoProvento()}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:border-amber-400/40 dark:hover:bg-amber-500/15 sm:w-auto"
          >
            <Coins className="w-3.5 h-3.5" />
            Declarar Provento
          </button>
          {onOpenLancamentos && (
            <button
              onClick={onOpenLancamentos}
              className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06] sm:w-auto"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              Ver Lançamentos
            </button>
          )}

          <button
            type="button"
            onClick={onOpenImportacaoB3}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-emerald-400/20 dark:bg-emerald-500/[0.07] dark:text-emerald-200 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/12 sm:w-auto"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Importar B3
          </button>
        </div>
      </header>

      {/* Barra de busca, filtros e atualização */}
      <section
        aria-label="Filtros e ordenação da carteira"
        className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.025] lg:flex-row lg:items-center"
      >
        <div className="hidden shrink-0 items-center gap-2 px-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:flex">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Exibição
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_minmax(155px,auto)]">
          <label className="relative min-w-0">
            <span className="sr-only">Buscar ativo na carteira</span>
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar ticker ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-500 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-100"
            />
          </label>

          <div className="flex min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-white/[0.08] dark:bg-white/[0.03] sm:w-auto" role="group" aria-label="Filtrar por tipo de ativo">
            {(['TODOS', 'Acao', 'FII'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                aria-pressed={filtroTipo === tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`flex-1 rounded-lg px-3 py-1 text-xs font-semibold transition sm:flex-none ${filtroTipo === tipo
                    ? 'border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'border border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                {tipo === 'TODOS' ? 'Todos' : tipo === 'Acao' ? 'Ações' : 'FIIs'}
              </button>
            ))}
          </div>

          <label className="relative min-w-0">
            <span className="sr-only">Ordenar carteira</span>
            <ArrowDownWideNarrow className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as 'saldo' | 'rentabilidade' | 'ticker')}
              className="min-h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-semibold text-slate-700 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300"
            >
              <option value="saldo">Maior saldo</option>
              <option value="rentabilidade">Rentabilidade</option>
              <option value="ticker">Ordem alfabética</option>
            </select>
          </label>
        </div>

        {onAtualizarPrecos && (
          <div className="lg:border-l lg:border-slate-200 lg:pl-2.5 dark:lg:border-white/[0.07]">
            <button
              type="button"
              onClick={atualizarCotacoes}
              disabled={carregandoPrecos}
              aria-busy={carregandoPrecos}
              className="flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 lg:w-auto"
              title="Consultar o mercado e atualizar os preços"
            >
              <RefreshCw className={`h-4 w-4 ${carregandoPrecos ? 'animate-spin text-emerald-500' : ''}`} />
              <span>{carregandoPrecos ? 'Consultando...' : 'Atualizar preços'}</span>
            </button>
          </div>
        )}
      </section>

      {retornoAtualizacao && (
        <div aria-live="polite" className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.025]">
          <p className={`text-xs font-medium ${retornoAtualizacao.erro ? 'text-amber-300' : 'text-emerald-300'}`}>
            {retornoAtualizacao.mensagem}
          </p>
        </div>
      )}

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
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold ${pos.tipo === 'FII'
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
                        {formatarDinheiro(pos.precoMedio)}
                      </td>

                      {/* Preço Atual */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-cyan-400 tabular-nums">
                        {formatarDinheiro(pos.precoAtual)}
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
