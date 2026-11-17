import React, { useState, useEffect } from 'react';
import { X, Coins, DollarSign, Calendar, Hash, Sparkles } from 'lucide-react';
import { Ativo } from '../types';
import { AtivoCombobox } from './AtivoCombobox';

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

  const handleSelectAtivo = (ativo: { ticker: string; precoAtual: number; nome?: string }) => {
    setTicker(ativo.ticker);
    const encontrado = ativos.find((a) => a.ticker === ativo.ticker);
    if (encontrado?.tipo === 'FII') {
      setTipoProvento('Rendimento');
    }
  };

  const cotaNum = parseFloat(valorPorCota.replace(',', '.')) || 0;
  const qtdNum = parseFloat(quantidadeCotas.replace(',', '.')) || 0;
  const totalCalculado = valorTotalManual
    ? parseFloat(valorTotalManual.replace(',', '.')) || 0
    : cotaNum * qtdNum;

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

  const tiposDisponiveis = [
    { id: 'Dividendo', label: 'Dividendo (Ação)' },
    { id: 'JCP', label: 'JCP (Juros s/ Capital)' },
    { id: 'Rendimento', label: 'Rendimento (FII)' },
    { id: 'Amortizacao', label: 'Amortização' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Registrar Provento</h3>
            <p className="text-xs text-slate-400">
              Lance dividendos, JCP ou rendimentos de fundos imobiliários recebidos
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Tipo de Provento em Pílulas */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tipo de Provento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
              {tiposDisponiveis.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipoProvento(t.id)}
                  className={`py-2 px-2 text-[11px] font-bold rounded-xl transition-all ${
                    tipoProvento === t.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.id}
                </button>
              ))}
            </div>
          </div>

          {/* Combobox de Ativos */}
          <AtivoCombobox
            ativos={ativos}
            selectedTicker={ticker}
            onSelectAtivo={handleSelectAtivo}
            accentColor="amber"
          />

          {/* Datas: Pagamento e Data Com */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data de Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data Com (Base)
              </label>
              <input
                type="date"
                value={dataCom}
                onChange={(e) => setDataCom(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Valor por Cota e Quantidade de Cotas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor por Cota
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-slate-400 font-mono">R$</span>
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
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Qtd de Cotas na Data Com
              </label>
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Rendimento referente a Outubro/2026"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Total Preview */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total a ser Creditado</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {qtdNum} cotas × R$ {cotaNum.toFixed(4)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-amber-400">
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
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 transition"
            >
              {salvando ? 'Salvando...' : 'Salvar Provento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
