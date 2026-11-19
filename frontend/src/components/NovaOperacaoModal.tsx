import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowRight, Calculator, AlertTriangle } from 'lucide-react';
import { Ativo, PosicaoCarteira } from '../types';
import { AtivoCombobox } from './AtivoCombobox';
import { formatarDinheiro, aplicarMascaraDinheiro } from '../utils/formatters';

interface NovaOperacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ativos: Ativo[];
  posicoes: PosicaoCarteira[];
  defaultTicker?: string;
  defaultTipo?: 'COMPRA' | 'VENDA';
  onSubmit: (data: {
    ticker?: string;
    ativoId?: number;
    tipoOperacao: 'COMPRA' | 'VENDA';
    dataOperacao: string;
    quantidade: number;
    precoUnitario: number;
    taxas?: number;
    observacoes?: string;
  }) => Promise<void>;
}

export const NovaOperacaoModal: React.FC<NovaOperacaoModalProps> = ({
  isOpen,
  onClose,
  ativos,
  posicoes,
  defaultTicker = '',
  defaultTipo = 'COMPRA',
  onSubmit,
}) => {
  const listaAtivos = Array.isArray(ativos) ? ativos : [];
  const [ticker, setTicker] = useState(defaultTicker || '');
  const [tipoOperacao, setTipoOperacao] = useState<'COMPRA' | 'VENDA'>(defaultTipo || 'COMPRA');
  const [dataOperacao, setDataOperacao] = useState(new Date().toISOString().split('T')[0]);
  const [quantidade, setQuantidade] = useState<string>('100');
  const [precoUnitario, setPrecoUnitario] = useState<string>('');
  const [taxas, setTaxas] = useState<string>('0');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialTicker = (defaultTicker || '').trim();
      setTicker(initialTicker);
      setTipoOperacao(defaultTipo || 'COMPRA');
      setQuantidade('100');
      setTaxas('0');
      setObservacoes('');
      if (initialTicker) {
        const ativo = listaAtivos.find(
          (a) => (a?.ticker || '').toUpperCase() === initialTicker.toUpperCase()
        );
        if (ativo && typeof ativo.precoAtual === 'number' && ativo.precoAtual > 0) {
          setPrecoUnitario(aplicarMascaraDinheiro((ativo.precoAtual * 100).toString()));
        } else {
          setPrecoUnitario('');
        }
      } else {
        setPrecoUnitario('');
      }
    }
  }, [isOpen, defaultTicker, defaultTipo, listaAtivos]);

  // Fecha o modal ao pressionar ESC (declarado no nível superior com todos os hooks)
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

  const handleSelectAtivo = (ativo: { ticker: string; precoAtual: number; nome?: string }) => {
    const t = (ativo?.ticker || '').toUpperCase();
    setTicker(t);
    if (ativo && typeof ativo.precoAtual === 'number' && ativo.precoAtual > 0) {
      setPrecoUnitario(aplicarMascaraDinheiro((ativo.precoAtual * 100).toString()));
    } else if (!t) {
      setPrecoUnitario('');
    }
  };

  const qtdNum = parseFloat(quantidade.replace(',', '.')) || 0;
  const precoNum = parseFloat(precoUnitario.replace(/\./g, '').replace(',', '.')) || 0;
  const taxasNum = parseFloat(taxas.replace(/\./g, '').replace(',', '.')) || 0;
  const subtotal = qtdNum * precoNum;
  const totalCalculado = subtotal + (tipoOperacao === 'COMPRA' ? taxasNum : -taxasNum);
  const tickerNormalizado = ticker.trim().toUpperCase();
  const ativoSelecionado = listaAtivos.find((ativo) => ativo.ticker.toUpperCase() === tickerNormalizado);
  const posicaoAtual = posicoes.find((posicao) => posicao.ticker.toUpperCase() === tickerNormalizado);
  const quantidadeAtual = posicaoAtual?.quantidadeCustodia ?? 0;
  const precoMedioAtual = posicaoAtual?.precoMedio ?? 0;
  const vendaSemSaldo = tipoOperacao === 'VENDA' && quantidadeAtual <= 0;
  const vendaAcimaDaCustodia = tipoOperacao === 'VENDA' && qtdNum > quantidadeAtual;
  const vendaInvalida = vendaSemSaldo || vendaAcimaDaCustodia;
  const quantidadeProjetada = tipoOperacao === 'COMPRA'
    ? quantidadeAtual + qtdNum
    : Math.max(quantidadeAtual - qtdNum, 0);
  const custoAtual = quantidadeAtual * precoMedioAtual;
  const precoMedioProjetado = tipoOperacao === 'COMPRA'
    ? (quantidadeProjetada > 0 ? (custoAtual + subtotal + taxasNum) / quantidadeProjetada : precoMedioAtual)
    : (quantidadeProjetada > 0 ? precoMedioAtual : 0);
  const variacaoPrecoMedio = precoMedioProjetado - precoMedioAtual;
  const resultadoVendaEstimado = ((precoNum - precoMedioAtual) * qtdNum) - taxasNum;
  const simulacaoDisponivel = Boolean(tickerNormalizado) && qtdNum > 0 && precoNum > 0 && !vendaInvalida;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      alert('Informe o Ticker do ativo (ex: BBAS3, MXRF11).');
      return;
    }
    if (!ativoSelecionado) {
      alert(`Cadastre ${tickerNormalizado} e informe sua classe fiscal antes de registrar a operação.`);
      return;
    }
    if (qtdNum <= 0 || precoNum <= 0) {
      alert('Quantidade e Preço devem ser maiores que zero.');
      return;
    }
    if (vendaSemSaldo) {
      alert(`Você não possui ${tickerNormalizado} em custódia para realizar esta venda.`);
      return;
    }
    if (vendaAcimaDaCustodia) {
      alert(`A venda excede sua custódia atual de ${quantidadeAtual.toLocaleString('pt-BR')} cotas.`);
      return;
    }

    setSalvando(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        tipoOperacao,
        dataOperacao,
        quantidade: qtdNum,
        precoUnitario: precoNum,
        taxas: taxasNum,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar operação.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          (e.target as HTMLElement).dataset.mousedown = "true";
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && (e.target as HTMLElement).dataset.mousedown === "true") {
          onClose();
        }
        (e.target as HTMLElement).dataset.mousedown = "false";
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-7 shadow-2xl relative"
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tipoOperacao === 'COMPRA'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
          >
            {tipoOperacao === 'COMPRA' ? (
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Registrar Operação</h3>
            <p className="text-xs text-slate-400">
              {tipoOperacao === 'COMPRA'
                ? 'Atualiza o Preço Médio ponderado e adiciona à custódia'
                : 'Calcula o lucro/prejuízo realizado e abate da custódia'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor COMPRA ou VENDA em Abas Modernas */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setTipoOperacao('COMPRA')}
              className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${tipoOperacao === 'COMPRA'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              COMPRA
            </button>
            <button
              type="button"
              onClick={() => setTipoOperacao('VENDA')}
              className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${tipoOperacao === 'VENDA'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              VENDA
            </button>
          </div>

          {/* Combobox de Ativos com Busca Elegante */}
          <AtivoCombobox
            ativos={listaAtivos}
            selectedTicker={ticker}
            onSelectAtivo={handleSelectAtivo}
            accentColor={tipoOperacao === 'COMPRA' ? 'emerald' : 'cyan'}
          />

          {/* Quantidade e Preço Unitário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantidade
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ex: 100"
                  value={quantidade}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setQuantidade(val);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Preço Unitário
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-slate-400 font-mono">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={precoUnitario}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPrecoUnitario(aplicarMascaraDinheiro(val));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Data e Taxas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data da Operação
              </label>
              <input
                type="date"
                value={dataOperacao}
                onChange={(e) => setDataOperacao(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Taxas / Emolumentos
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-slate-400 font-mono">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={taxas}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setTaxas(aplicarMascaraDinheiro(val));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Aporte mensal, compra fracionária, etc..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Resumo financeiro e simulação do novo Preço Médio */}
          <section className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden" aria-live="polite">
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">Total da Operação</span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {qtdNum} cotas × {formatarDinheiro(precoNum)}
                  {taxasNum > 0 ? ` ${tipoOperacao === 'COMPRA' ? '+' : '−'} ${formatarDinheiro(taxasNum)} taxas` : ''}
                </span>
              </div>
              <span
                className={`text-xl font-bold font-mono tabular-nums ${tipoOperacao === 'COMPRA' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {formatarDinheiro(totalCalculado)}
              </span>
            </div>

            <div className={`border-t px-4 py-3.5 ${tipoOperacao === 'COMPRA' ? 'border-emerald-500/15 bg-emerald-500/[0.035]' : 'border-rose-500/15 bg-rose-500/[0.035]'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Calculator className={`w-3.5 h-3.5 ${tipoOperacao === 'COMPRA' ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
                  Simulação após confirmar
                </span>
                <span className="ml-auto text-[10px] text-slate-500 font-mono">{tickerNormalizado || 'Selecione um ativo'}</span>
              </div>

              {vendaInvalida ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold">
                      {vendaSemSaldo ? 'Ativo sem saldo em custódia' : 'Quantidade acima da custódia disponível'}
                    </p>
                    <p className="text-[10px] text-amber-200/65 mt-0.5">
                      Você possui {quantidadeAtual.toLocaleString('pt-BR')} cotas de {tickerNormalizado || 'este ativo'}.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-1">Preço médio atual</span>
                      <strong className="block text-sm text-slate-300 font-mono tabular-nums">
                        {formatarDinheiro(precoMedioAtual)}
                      </strong>
                      <span className="block text-[10px] text-slate-500 font-mono mt-1">
                        {quantidadeAtual.toLocaleString('pt-BR')} cotas
                      </span>
                    </div>

                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${tipoOperacao === 'COMPRA' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'}`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500 mb-1">Preço médio simulado</span>
                      <strong className={`block text-base font-mono tabular-nums ${tipoOperacao === 'COMPRA' ? 'text-emerald-400' : 'text-rose-300'}`}>
                        {simulacaoDisponivel ? formatarDinheiro(precoMedioProjetado) : '—'}
                      </strong>
                      <span className="block text-[10px] text-slate-400 font-mono mt-1">
                        {simulacaoDisponivel ? `${quantidadeProjetada.toLocaleString('pt-BR')} cotas após operação` : 'Preencha os valores'}
                      </span>
                    </div>
                  </div>

                  {simulacaoDisponivel && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between gap-3 text-[10px]">
                      <span className="text-slate-500">
                        {tipoOperacao === 'COMPRA'
                          ? (quantidadeAtual > 0 ? 'Impacto no preço médio' : 'Abertura de nova posição')
                          : (quantidadeProjetada > 0 ? 'Venda não altera o preço médio contábil' : 'A posição será encerrada')}
                      </span>
                      <span className={`font-mono font-semibold tabular-nums ${tipoOperacao === 'COMPRA'
                        ? variacaoPrecoMedio >= 0 ? 'text-amber-300' : 'text-emerald-300'
                        : resultadoVendaEstimado >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}>
                        {tipoOperacao === 'COMPRA'
                          ? quantidadeAtual > 0 ? `${variacaoPrecoMedio >= 0 ? '+' : ''}${formatarDinheiro(variacaoPrecoMedio)}` : formatarDinheiro(precoMedioProjetado)
                          : `Resultado estimado: ${resultadoVendaEstimado >= 0 ? '+' : ''}${formatarDinheiro(resultadoVendaEstimado)}`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || vendaInvalida}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl text-white shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${tipoOperacao === 'COMPRA'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
            >
              {salvando ? 'Salvando...' : `Confirmar ${tipoOperacao}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
