import React from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface ErrorDialogProps {
  title: string;
  message: string;
  error?: string;
  onRetry: () => void;
  onHome: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({ title, message, error, onRetry, onHome }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-[#0b0f1a] border border-white/[0.08] rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        
        <h2 className="text-xl font-black text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        
        {error && (
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/30 text-rose-400 text-xs font-mono mb-6 text-left">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition"
          >
            <RotateCw className="w-4 h-4" />
            Recarregar
          </button>
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <Home className="w-4 h-4" />
            Início
          </button>
        </div>
      </div>
    </div>
  );
};
