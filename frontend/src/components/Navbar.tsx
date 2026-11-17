import React from 'react';
import {
  TrendingUp,
  Plus,
  DollarSign,
  Wallet,
  ArrowDownUp,
  BarChart3,
  Coins,
  Award,
  Newspaper,
  Star
} from 'lucide-react';
import { ResumoCarteira } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resumo: ResumoCarteira | null;
  favoritosCount: number;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  resumo,
  favoritosCount,
  onOpenNovaOperacao,
  onOpenNovoProvento,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'carteira', label: 'Minha Carteira', icon: Wallet },
    { id: 'performance', label: 'Altas & Baixas (Top 7)', icon: Award, highlight: true },
    { id: 'mercado', label: 'Top 30 Mercado', icon: TrendingUp },
    { id: 'noticias', label: 'Notícias & Favoritos', icon: Newspaper, badge: favoritosCount > 0 ? favoritosCount : undefined },
    { id: 'proventos', label: 'Proventos', icon: Coins },
    { id: 'operacoes', label: 'Lançamentos', icon: ArrowDownUp },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                InvestirGo
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                B3 & FIIs
              </span>
            </div>
          </div>

          {/* Quick Resumo Badge */}
          {resumo && (
            <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Patrimônio Atual</span>
                <span className="font-bold text-slate-100 font-mono">
                  {resumo.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Rentabilidade</span>
                <span className={`font-bold font-mono flex items-center gap-1 ${resumo.lucroPrejuizoNaoRealizado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resumo.lucroPrejuizoNaoRealizado >= 0 ? '+' : ''}
                  {resumo.rentabilidadePercentual.toFixed(2)}%
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Proventos</span>
                <span className="font-bold font-mono text-amber-400">
                  {resumo.totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons & Quick Favorites */}
          <div className="flex items-center gap-2">
            {/* Quick Favorites Shortcut */}
            <button
              onClick={() => setActiveTab('noticias')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                activeTab === 'noticias'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Acompanhar Notícias e Ativos Favoritos"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Favoritos</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                {favoritosCount}
              </span>
            </button>

            <button
              onClick={() => onOpenNovoProvento()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">+ Provento</span>
            </button>

            <button
              onClick={() => onOpenNovaOperacao()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Operação</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md shadow-slate-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
