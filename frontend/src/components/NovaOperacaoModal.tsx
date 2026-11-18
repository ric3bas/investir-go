import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, Hash, Tag, Calculator } from 'lucide-react';
import { Ativo } from '../types';
import { TOP_30_ATIVOS } from '../utils/marketData';
import { AtivoCombobox } from './AtivoCombobox';

interface NovaOperacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ativos: Ativo[];
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
  defaultTicker = '',
  defaultTipo = 'COMPRA',
  onSubmit,
}) => {
  const listaAtivos = Array.isArray(ativos) && ativos.length > 0 ? ativos : TOP_30_ATIVOS;
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
          setPrecoUnitario(ativo.precoAtual.toString());
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
      setPrecoUnitario(ativo.precoAtual.toString());
    } else if (!t) {
      setPrecoUnitario('');
    }
  };

  const qtdNum = parseFloat(quantidade.replace(',', '.')) || 0;
  const precoNum = parseFloat(precoUnitario.replace(',', '.')) || 0;
  const taxasNum = parseFloat(taxas.replace(',', '.')) || 0;
  const subtotal = qtdNum * precoNum;
  const totalCalculado = subtotal + (tipoOperacao === 'COMPRA' ? taxasNum : -taxasNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      alert('Informe o Ticker do ativo (ex: BBAS3, MXRF11).');
      return;
    }
    if (qtdNum <= 0 || precoNum <= 0) {
      alert('Quantidade e Preço devem ser maiores que zero.');
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
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative"
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
                  type="number"
                  step="any"
                  min="0.0001"
                  placeholder="Ex: 100"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={taxas}
                  onChange={(e) => setTaxas(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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

          {/* Resumo e Cálculo do Total */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total da Operação</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {qtdNum} cotas × R$ {precoNum.toFixed(2)}
                {taxasNum > 0 ? ` (+ R$ ${taxasNum.toFixed(2)} taxas)` : ''}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-xl font-bold font-mono ${tipoOperacao === 'COMPRA' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
              >
                {totalCalculado.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>

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
              disabled={salvando}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl text-white shadow-xl transition ${tipoOperacao === 'COMPRA'
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
