import React from 'react';
import { TrendingUp, Plus, DollarSign, Wallet, ArrowDownUp, BarChart3, PieChart, Coins } from 'lucide-react';
import { ResumoCarteira } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resumo: ResumoCarteira | null;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  resumo,
  onOpenNovaOperacao,
  onOpenNovoProvento,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'carteira', label: 'Minha Carteira', icon: Wallet },
    { id: 'operacoes', label: 'Lançamentos (Compras/Vendas)', icon: ArrowDownUp },
    { id: 'proventos', label: 'Proventos', icon: Coins },
    { id: 'mercado', label: 'Top 30 Ativos (Bolsa & FIIs)', icon: TrendingUp },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                InvestirGo
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                B3 & FIIs
              </span>
            </div>
          </div>

          {/* Quick Resumo Badge */}
          {resumo && (
            <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Patrimônio Atual</span>
                <span className="font-semibold text-slate-100">
                  {resumo.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 block">Rentabilidade</span>
                <span className={`font-semibold flex items-center gap-1 ${resumo.lucroPrejuizoNaoRealizado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resumo.lucroPrejuizoNaoRealizado >= 0 ? '+' : ''}
                  {resumo.rentabilidadePercentual.toFixed(2)}%
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 block">Proventos</span>
                <span className="font-semibold text-amber-400">
                  {resumo.totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNovoProvento()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">+ Provento</span>
            </button>
            <button
              onClick={() => onOpenNovaOperacao()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Operação</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
