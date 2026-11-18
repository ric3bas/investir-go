import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Wallet,
  BarChart3,
  Coins,
  Award,
  Newspaper,
  Star,
  User,
  ShieldCheck,
  LogOut,
  ShieldAlert,
  LogIn,
  KeyRound,
  ChevronDown,
  ArrowDownUp
} from 'lucide-react';
import { ResumoCarteira } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resumo: ResumoCarteira | null;
  favoritosCount: number;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
  onOpenLancamentos?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  resumo,
  favoritosCount,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onOpenLancamentos,
}) => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    setLoginModalOpen,
    setRegisterModalOpen,
    setProfileModalOpen,
    setSecurityModalOpen,
    logout,
  } = useAuth();

  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };
    if (menuAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAberto]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'carteira', label: 'Minha Carteira', icon: Wallet },
    { id: 'performance', label: 'Altas & Baixas (Top 7)', icon: Award, highlight: true },
    { id: 'noticias', label: 'Notícias & Favoritos', icon: Newspaper, badge: favoritosCount > 0 ? favoritosCount : undefined },
    { id: 'proventos', label: 'Proventos', icon: Coins },
  ];

  return (
    <header className="border-b border-white/[0.06] bg-[#080c14]/85 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_12px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-100">
                Investir<span className="text-emerald-400">Go</span>
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                B3 & FIIs
              </span>
            </div>
          </div>

          {/* Institutional KPI Summary Pills */}
          {resumo && (
            <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Patrimônio</span>
                <span className="font-mono font-bold text-slate-100 tabular-nums">
                  {resumo.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="h-6 w-px bg-white/[0.08]" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Rentabilidade</span>
                <span className={`font-mono font-bold tabular-nums flex items-center gap-1 ${resumo.lucroPrejuizoNaoRealizado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resumo.lucroPrejuizoNaoRealizado >= 0 ? '+' : ''}
                  {resumo.rentabilidadePercentual.toFixed(2)}%
                </span>
              </div>
              <div className="h-6 w-px bg-white/[0.08]" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Proventos</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  {resumo.totalProventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons, Quick Favorites & Auth Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Favorites Shortcut */}
            <button
              onClick={() => setActiveTab('noticias')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeTab === 'noticias'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm'
                  : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border-white/[0.06]'
              }`}
              title="Acompanhar Notícias e Ativos Favoritos"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Favoritos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                {favoritosCount}
              </span>
            </button>

            <button
              onClick={() => onOpenNovoProvento()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25 transition shadow-sm"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">+ Provento</span>
            </button>

            <button
              onClick={() => onOpenNovaOperacao()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_12px_rgba(16,185,129,0.25)]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nova Operação</span>
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-white/[0.08] mx-1 hidden sm:block" />

            {/* Authentication & User Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuAberto(!menuAberto)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition shadow-sm ${
                    menuAberto
                      ? 'bg-slate-800 border-emerald-500/40 text-white'
                      : 'bg-slate-900/80 hover:bg-slate-800/80 border-white/[0.06] text-slate-200'
                  }`}
                  aria-expanded={menuAberto}
                  aria-haspopup="true"
                  title="Menu do Usuário"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[110px] truncate text-xs font-semibold hidden md:inline">
                    {user.nome}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] rounded font-mono font-bold uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {user.role}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      menuAberto ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Flutuante */}
                {menuAberto && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Cabeçalho do Perfil */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-emerald-500/20">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-100 truncate">{user.nome}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{user.email}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          Investidor Ativo
                        </span>
                      </div>
                    </div>

                    {/* Ações do Menu */}
                    <div className="py-1.5 text-xs space-y-0.5">
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/[0.04] transition text-left"
                      >
                        <User className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold block">Meu Perfil & Sessões</span>
                          <span className="text-[10px] text-slate-400">Dados da conta e dispositivos</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          setSecurityModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/[0.04] transition text-left"
                      >
                        <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-semibold block">Segurança & Autenticação</span>
                          <span className="text-[10px] text-slate-400">Alterar senha e configurar 2FA TOTP</span>
                        </div>
                      </button>

                      {onOpenLancamentos && (
                        <button
                          onClick={() => {
                            setMenuAberto(false);
                            onOpenLancamentos();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/[0.04] transition text-left"
                        >
                          <ArrowDownUp className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold block">Histórico de Lançamentos</span>
                            <span className="text-[10px] text-slate-400">Extrato completo de compras e vendas</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-white/[0.06] my-1" />

                    {/* Botão de Logout */}
                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Sair da Conta (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
                >
                  Cadastrar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2 border-t border-white/[0.04] no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800/90 text-emerald-400 border border-white/[0.08] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
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
