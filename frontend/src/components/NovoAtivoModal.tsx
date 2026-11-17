import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';

interface NovoAtivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTicker?: string;
  defaultNome?: string;
  defaultTipo?: 'Acao' | 'FII' | 'BDR' | 'ETF';
  defaultSetor?: string;
  defaultPreco?: number;
  defaultDividendYield?: number;
  onSubmit: (data: {
    ticker: string;
    nome: string;
    tipo: string;
    setor?: string;
    precoAtual: number;
    dividendYield?: number;
  }) => Promise<void>;
}

export const NovoAtivoModal: React.FC<NovoAtivoModalProps> = ({
  isOpen,
  onClose,
  defaultTicker = '',
  defaultNome = '',
  defaultTipo,
  defaultSetor = '',
  defaultPreco,
  defaultDividendYield,
  onSubmit,
}) => {
  const [ticker, setTicker] = useState(defaultTicker);
  const [nome, setNome] = useState(defaultNome);
  const [tipo, setTipo] = useState<'Acao' | 'FII' | 'BDR' | 'ETF'>('Acao');
  const [setor, setSetor] = useState(defaultSetor);
  const [precoAtual, setPrecoAtual] = useState(defaultPreco !== undefined ? defaultPreco.toString() : '');
  const [dividendYield, setDividendYield] = useState(defaultDividendYield !== undefined ? defaultDividendYield.toString() : '');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTicker(defaultTicker || '');
      setNome(defaultNome || '');
      const tipoPadrao = defaultTipo || (defaultTicker && defaultTicker.endsWith('11') ? 'FII' : 'Acao');
      setTipo(tipoPadrao);
      setSetor(defaultSetor || '');
      setPrecoAtual(defaultPreco !== undefined ? defaultPreco.toString() : '');
      setDividendYield(defaultDividendYield !== undefined ? defaultDividendYield.toString() : '');
    }
  }, [isOpen, defaultTicker, defaultNome, defaultTipo, defaultSetor, defaultPreco, defaultDividendYield]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preco = parseFloat(precoAtual.replace(',', '.'));
    if (!ticker.trim() || isNaN(preco) || preco <= 0) {
      alert('Preencha o ticker e um preço válido.');
      return;
    }

    setSalvando(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        nome: nome.trim() || ticker.trim().toUpperCase(),
        tipo,
        setor: setor.trim() || undefined,
        precoAtual: preco,
        dividendYield: dividendYield ? parseFloat(dividendYield.replace(',', '.')) : 0,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao cadastrar ativo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Cadastrar Novo Ativo</h3>
            <p className="text-xs text-slate-400">Adicione uma ação ou FII ao catálogo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ticker</label>
            <input
              type="text"
              placeholder="Ex: WEGE3, KNRI11"
              value={ticker}
              onChange={(e) => {
                const t = e.target.value.toUpperCase();
                setTicker(t);
                if (t.endsWith('11')) setTipo('FII');
              }}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono uppercase focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Empresa / Fundo</label>
            <input
              type="text"
              placeholder="Ex: WEG S.A."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="Acao">Ação</option>
                <option value="FII">FII</option>
                <option value="BDR">BDR</option>
                <option value="ETF">ETF</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Setor</label>
              <input
                type="text"
                placeholder="Ex: Motores Industriais"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preço Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 52.40"
                value={precoAtual}
                onChange={(e) => setPrecoAtual(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dividend Yield (% a.a.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 8.50"
                value={dividendYield}
                onChange={(e) => setDividendYield(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

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
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 transition"
            >
              {salvando ? 'Salvando...' : 'Cadastrar Ativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
