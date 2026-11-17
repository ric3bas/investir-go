import React, { useState, useEffect } from 'react';
import { X, Coins, DollarSign, Calendar, Hash } from 'lucide-react';
import { Ativo } from '../types';

interface NovoProventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ativos: Ativo[];
  defaultTicker?: string;
  onSubmit: (data: {
    ticker?: string;
    ativoId?: number;
    tipoProvento: string;
    dataCom?: string;
    dataPagamento: string;
    valorPorCota: number;
    quantidadeCotas: number;
    valorTotal: number;
    observacoes?: string;
  }) => Promise<void>;
}

export const NovoProventoModal: React.FC<NovoProventoModalProps> = ({
  isOpen,
  onClose,
  ativos,
  defaultTicker = '',
  onSubmit,
}) => {
  const [ticker, setTicker] = useState(defaultTicker);
  const [tipoProvento, setTipoProvento] = useState('Dividendo');
  const [dataCom, setDataCom] = useState('');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [valorPorCota, setValorPorCota] = useState<string>('0.50');
  const [quantidadeCotas, setQuantidadeCotas] = useState<string>('100');
  const [valorTotalManual, setValorTotalManual] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (defaultTicker) {
      setTicker(defaultTicker);
      const ativo = ativos.find((a) => a.ticker.toUpperCase() === defaultTicker.toUpperCase());
      if (ativo && ativo.tipo === 'FII') {
        setTipoProvento('Rendimento');
      }
    }
  }, [defaultTicker, ativos, isOpen]);

  if (!isOpen) return null;

  const cotaNum = parseFloat(valorPorCota.replace(',', '.')) || 0;
  const qtdNum = parseFloat(quantidadeCotas.replace(',', '.')) || 0;
  const totalCalculado = valorTotalManual ? (parseFloat(valorTotalManual.replace(',', '.')) || 0) : (cotaNum * qtdNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      alert('Informe o ticker do ativo.');
      return;
    }
    if (totalCalculado <= 0) {
      alert('O valor total do provento deve ser maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        tipoProvento,
        dataCom: dataCom || undefined,
        dataPagamento,
        valorPorCota: cotaNum,
        quantidadeCotas: qtdNum,
        valorTotal: totalCalculado,
        observacoes: observacoes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar provento.');
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
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Registrar Provento</h3>
            <p className="text-xs text-slate-400">Lance dividendos, JCP ou rendimentos de fundos imobiliários</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker & Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ticker</label>
              <input
                type="text"
                placeholder="Ex: BBAS3, MXRF11"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Provento</label>
              <select
                value={tipoProvento}
                onChange={(e) => setTipoProvento(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Dividendo">Dividendo (Ação)</option>
                <option value="JCP">JCP (Juros s/ Capital)</option>
                <option value="Rendimento">Rendimento (FII)</option>
                <option value="Amortizacao">Amortização</option>
              </select>
            </div>
          </div>

          {/* Datas: Pagamento e Data Com */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data de Pagamento</label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data Com (Base)</label>
              <input
                type="date"
                value={dataCom}
                onChange={(e) => setDataCom(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Valor por Cota e Quantidade de Cotas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor por Cota (R$)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                placeholder="Ex: 0.4250"
                value={valorPorCota}
                onChange={(e) => {
                  setValorPorCota(e.target.value);
                  setValorTotalManual('');
                }}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade de Cotas</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 100"
                value={quantidadeCotas}
                onChange={(e) => {
                  setQuantidadeCotas(e.target.value);
                  setValorTotalManual('');
                }}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Valor Total Direto (Opcional se quiser sobrepor) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Valor Total Recebido (R$) <span className="text-slate-500 font-normal">- calculado automaticamente</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={totalCalculado.toFixed(2)}
              value={valorTotalManual}
              onChange={(e) => setValorTotalManual(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Dividendo referente ao 3T26"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Total Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total a ser creditado:</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {totalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {/* Ações */}
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
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition"
            >
              {salvando ? 'Salvando...' : 'Salvar Provento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
