import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, Hash, Tag } from 'lucide-react';
import { Ativo } from '../types';

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
  const [ticker, setTicker] = useState(defaultTicker);
  const [tipoOperacao, setTipoOperacao] = useState<'COMPRA' | 'VENDA'>(defaultTipo);
  const [dataOperacao, setDataOperacao] = useState(new Date().toISOString().split('T')[0]);
  const [quantidade, setQuantidade] = useState<string>('100');
  const [precoUnitario, setPrecoUnitario] = useState<string>('');
  const [taxas, setTaxas] = useState<string>('0');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (defaultTicker) {
      setTicker(defaultTicker);
      const ativo = ativos.find((a) => a.ticker.toUpperCase() === defaultTicker.toUpperCase());
      if (ativo) {
        setPrecoUnitario(ativo.precoAtual.toString());
      }
    }
    if (defaultTipo) {
      setTipoOperacao(defaultTipo);
    }
  }, [defaultTicker, defaultTipo, ativos, isOpen]);

  if (!isOpen) return null;

  const handleTickerChange = (novoTicker: string) => {
    setTicker(novoTicker.toUpperCase());
    const ativo = ativos.find((a) => a.ticker.toUpperCase() === novoTicker.toUpperCase());
    if (ativo && !precoUnitario) {
      setPrecoUnitario(ativo.precoAtual.toString());
    }
  };

  const qtdNum = parseFloat(quantidade.replace(',', '.')) || 0;
  const precoNum = parseFloat(precoUnitario.replace(',', '.')) || 0;
  const taxasNum = parseFloat(taxas.replace(',', '.')) || 0;
  const totalCalculado = qtdNum * precoNum + (tipoOperacao === 'COMPRA' ? taxasNum : -taxasNum);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              tipoOperacao === 'COMPRA'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {tipoOperacao === 'COMPRA' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Registrar Operação</h3>
            <p className="text-xs text-slate-400">Insira sua compra ou venda para atualizar o preço médio</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor COMPRA ou VENDA */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTipoOperacao('COMPRA')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                tipoOperacao === 'COMPRA'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              COMPRA
            </button>
            <button
              type="button"
              onClick={() => setTipoOperacao('VENDA')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                tipoOperacao === 'VENDA'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              VENDA
            </button>
          </div>

          {/* Ticker & Sugestões */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ticker do Ativo</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: BBAS3, TAEE4, MXRF11..."
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono uppercase focus:outline-none focus:border-emerald-500"
                required
              />
              <select
                onChange={(e) => handleTickerChange(e.target.value)}
                value=""
                className="px-2 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none"
              >
                <option value="" disabled>
                  Top Ativos...
                </option>
                {ativos.map((a) => (
                  <option key={a.id} value={a.ticker}>
                    {a.ticker} - {a.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade e Preço Unitário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                placeholder="Ex: 100"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preço Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 14.95"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Data e Taxas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data da Operação</label>
              <input
                type="date"
                value={dataOperacao}
                onChange={(e) => setDataOperacao(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Taxas / Emolumentos (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={taxas}
                onChange={(e) => setTaxas(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: aporte mensal, corretora Rico / XP..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Preview do Total */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total da Operação:</span>
            <span className="text-lg font-bold text-slate-100 font-mono">
              {totalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg transition ${
                tipoOperacao === 'COMPRA'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
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
