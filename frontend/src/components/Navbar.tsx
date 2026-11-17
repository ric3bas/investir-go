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

          {/* Action Buttons, Quick Favorites & Auth Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Favorites Shortcut */}
            <button
              onClick={() => setActiveTab('noticias')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${activeTab === 'noticias'
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">+ Provento</span>
            </button>

            <button
              onClick={() => onOpenNovaOperacao()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Operação</span>
            </button>

            {/* Divisor de Ações */}
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Bloco de Autenticação com Dropdown Menu Unificado */}
            {isAuthenticated && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuAberto(!menuAberto)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition shadow-sm ${
                    menuAberto
                      ? 'bg-slate-750 border-emerald-500/50 text-white'
                      : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
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
                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold uppercase tracking-wider ${
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
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Cabeçalho do Perfil */}
                    <div className="px-4 py-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/20">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-100 truncate">{user.nome}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          👤 Investidor
                        </span>
                      </div>
                    </div>

                    {/* Ações e Navegação Interna do Menu */}
                    <div className="py-1.5 text-xs space-y-0.5">

                      {/* Meu Perfil e Sessões */}
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                      >
                        <User className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold block">Meu Perfil & Sessões</span>
                          <span className="text-[10px] text-slate-400">Dados da conta e dispositivos conectados</span>
                        </div>
                      </button>

                      {/* Segurança & MFA */}
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          setSecurityModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                      >
                        <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-semibold block">Segurança & Autenticação</span>
                          <span className="text-[10px] text-slate-400">Alterar senha e configurar 2FA TOTP</span>
                        </div>
                      </button>

                      {/* Histórico de Lançamentos */}
                      {onOpenLancamentos && (
                        <button
                          onClick={() => {
                            setMenuAberto(false);
                            onOpenLancamentos();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
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
                    <div className="border-t border-slate-800/80 my-1" />

                    {/* Botão de Logout */}
                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          setMenuAberto(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left"
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
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-150 ${isActive
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
