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
  KeyRound,
  ChevronDown,
  Menu,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownUp,
  Eye,
  EyeOff,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { ResumoCarteira } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useCotacaoDolar } from '../hooks/useCotacaoDolar';

export interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resumo: ResumoCarteira | null;
  favoritosCount: number;
  totalOperacoes?: number;
  onOpenNovaOperacao: (defaultTicker?: string, defaultTipo?: 'COMPRA' | 'VENDA') => void;
  onOpenNovoProvento: (defaultTicker?: string) => void;
  onOpenLancamentos?: () => void;
}

const navigationGroups = [
  {
    group: 'Portfólio & Gestão',
    items: [
      { id: 'dashboard', label: 'Dashboard Consolidado', icon: BarChart3 },
      { id: 'carteira', label: 'Minha Carteira & PM', icon: Wallet },
      { id: 'performance', label: 'Altas & Baixas (Top 7)', icon: Award },
    ]
  },
  {
    group: 'Mercado & Inteligência',
    items: [
      { id: 'noticias', label: 'Notícias & Favoritos', icon: Newspaper },
      { id: 'proventos', label: 'Fluxo de Proventos', icon: Coins },
    ]
  },
];

// ============================================================================
// COMPONENTE: SIDEBAR LATERAL (DESKTOP)
// ============================================================================
export const Sidebar: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  resumo,
  favoritosCount,
  totalOperacoes,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onOpenLancamentos,
}) => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    setProfileModalOpen,
    setSecurityModalOpen,
    logout,
  } = useAuth();
  const { esconderValores, toggleEsconderValores, formatarValor } = usePrivacy();
  const dolar = useCotacaoDolar();

  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const isLucro = (resumo?.lucroPrejuizoNaoRealizado ?? 0) >= 0;

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-white/[0.06] bg-[#070a12] p-5 shrink-0 select-none z-30 sticky top-0 h-screen overflow-y-auto">
      <div className="space-y-6">
        {/* Brand Logo & Radar Status */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_4px_16px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white">
                Investir<span className="text-emerald-400">Go</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                B3 Online
              </span>
            </div>
          </div>
        </div>

        {/* Cotação do Dólar Comercial Sempre Visível */}
        <div
          className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono shadow-sm"
          title={`Dólar Comercial (USD/BRL): R$ ${dolar.cotacao.toFixed(2)} (${dolar.variacao >= 0 ? '+' : ''}${dolar.variacao.toFixed(2)}%) • Mín: R$ ${dolar.minima.toFixed(2)} | Máx: R$ ${dolar.maxima.toFixed(2)}`}
        >
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
              $
            </div>
            <span className="font-semibold text-slate-300 text-[11px]">Dólar USD</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-white font-extrabold font-mono">
              R$ {dolar.cotacao.toFixed(2)}
            </span>
            <span
              className={`text-[10px] ${
                dolar.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {dolar.variacao >= 0 ? '+' : ''}
              {dolar.variacao.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Mini Card de Resumo de Patrimônio */}
        {resumo && (
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Patrimônio</span>
                <button
                  type="button"
                  onClick={toggleEsconderValores}
                  className="p-0.5 rounded text-slate-500 hover:text-slate-200 transition cursor-pointer"
                  title={esconderValores ? 'Mostrar valores' : 'Ocultar valores'}
                >
                  {esconderValores ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className={`font-bold flex items-center gap-0.5 ${isLucro ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isLucro ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {resumo.rentabilidadePercentual.toFixed(1)}%
              </span>
            </div>
            <div className="font-mono font-bold text-lg text-slate-100 tabular-nums">
              {formatarValor(resumo.saldoAtual)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-white/[0.04]">
              <span>Proventos:</span>
              <span className="text-amber-400 font-bold">
                {formatarValor(resumo.totalProventos)}
              </span>
            </div>
          </div>
        )}

        {/* Grupos de Navegação */}
        <nav className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.group} className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                {group.group}
              </span>
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const badge = tab.id === 'noticias' && favoritosCount > 0 ? favoritosCount : undefined;
                  const allItems = navigationGroups.flatMap(g => g.items);
  const currentLabel = allItems.find(i => i.id === activeTab)?.label || (activeTab === 'admin' ? 'Governança & Segurança' : 'Dashboard');

  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                      {badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Se for Admin */}
          {isAdmin && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
              <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider px-2">
                Governança
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
                  activeTab === 'admin'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/20 border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Painel Admin</span>
              </button>
            </div>
          )}
        </nav>

        {/* Ações Rápidas de Lançamento - Removidas */}
      </div>


      {/* Perfil do Usuário na Base do Sidebar */}
      {isAuthenticated && user && (
        <div className="pt-4 border-t border-white/[0.06] relative" ref={menuRef}>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.nome}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
          </button>

          {menuAberto && (
            <div className="absolute bottom-16 left-0 w-full rounded-2xl bg-[#0b0f1a] border border-white/[0.08] shadow-2xl p-2 z-50 space-y-1">
              <button
                onClick={() => {
                  setMenuAberto(false);
                  setProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition text-left"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => {
                  setMenuAberto(false);
                  setSecurityModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition text-left"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Segurança & MFA</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              <button
                onClick={() => {
                  setMenuAberto(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg transition text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

// ============================================================================
// COMPONENTE: TOP HEADER BAR
// ============================================================================
export const TopHeader: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  resumo,
  favoritosCount,
  totalOperacoes,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onOpenLancamentos,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dolar = useCotacaoDolar();
  const { toggleEsconderValores, esconderValores } = usePrivacy();

  const handleAtualizarDolar = () => {
    setIsRotating(true);
    dolar.atualizar();
    setTimeout(() => setIsRotating(false), 1000);
  };

  const allItems = navigationGroups.flatMap(g => g.items);
  const currentLabel = allItems.find(i => i.id === activeTab)?.label || (activeTab === 'admin' ? 'Governança & Segurança' : 'Dashboard');

  return (
    <>
      <header className="border-b border-white/[0.06] bg-[#070a12]/80 backdrop-blur-xl sticky top-0 z-20 h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Lado Esquerdo: Mobile Hamburger & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Portfólio /</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
              {currentLabel}
            </h1>
          </div>
        </div>

        {/* Lado Direito: Live B3 Status, Cotação Dólar Sempre Visível & Ações */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cotação do Dólar Comercial Sempre Visível */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono transition shadow-sm"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              $
            </div>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`Dólar Comercial (USD/BRL): R$ ${dolar.cotacao.toFixed(2)} (${dolar.variacao >= 0 ? '+' : ''}${dolar.variacao.toFixed(2)}%) • Mín: R$ ${dolar.minima.toFixed(2)} | Máx: R$ ${dolar.maxima.toFixed(2)} • Atualizado às ${dolar.dataHora}`}
            >
              <span className="font-extrabold text-white font-mono text-sm">
                {dolar.cotacao.toFixed(2)}
              </span>
              <span
                className={`font-bold text-sm ${
                  dolar.variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dolar.variacao >= 0 ? '+' : ''}
                {dolar.variacao.toFixed(1)}%
              </span>
            </div>
            <button
              onClick={handleAtualizarDolar}
              className={`p-1 rounded-lg text-slate-500 hover:text-emerald-400 transition ${dolar.carregando || isRotating ? 'animate-spin' : ''}`}
              title="Atualizar cotação do dólar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Market Badge */}
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm font-mono text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Pregão B3: 10h às 17h</span>
          </div>

          {/* Botão de Privacidade: Olho para Mostrar / Esconder Valores */}
          <button
            type="button"
            onClick={toggleEsconderValores}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer ${
              esconderValores
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-white border-white/[0.06]'
            }`}
            title={esconderValores ? 'Clique para mostrar todos os valores monetários' : 'Clique para ocultar valores monetários (Modo Privacidade)'}
            aria-label={esconderValores ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {esconderValores ? (
              <>
                <EyeOff className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                <span className="hidden xl:inline text-sm">Valores Ocultos</span>
              </>
            ) : (
              <>
                <Eye className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span className="hidden xl:inline text-sm">Ocultar Valores</span>
              </>
            )}
          </button>

          {/* Quick Favoritos */}
          <button
            onClick={() => setActiveTab('noticias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              activeTab === 'noticias'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 border-white/[0.06]'
            }`}
          >
            <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">Favoritos</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs">
              {favoritosCount}
            </span>
          </button>
        </div>
      </header>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-[#070a12] border-r border-white/[0.08] p-5 flex flex-col justify-between h-full overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">
                  Investir<span className="text-emerald-400">Go</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {navigationGroups.map(group => (
                  <div key={group.group} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-2">
                      {group.group}
                    </span>
                    {group.items.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border ${
                          activeTab === tab.id
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'text-slate-400 hover:text-white border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <tab.icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}

                {/* Ações Móveis - Removidas */}
              </div>
            </div>

            {isAuthenticated && (
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/20 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Default export wrapper para compatibilidade
export const Navbar: React.FC<NavigationProps> = (props) => {
  return <Sidebar {...props} />;
};

export default Navbar;
