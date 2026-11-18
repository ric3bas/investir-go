import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Coins,
  BarChart3,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Check
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    login,
    setRegisterModalOpen,
    setForgotModalOpen,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-teal-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[300px] bg-cyan-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <header className="border-b border-white/[0.06] bg-[#05070d]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_12px_rgba(16,185,129,0.25)]">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Investir<span className="text-emerald-400">Go</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                B3 & FIIs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/25 rounded-xl transition shadow-sm"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex items-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Lado Esquerdo: Hero & Demonstração da Plataforma */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gestão Institucional de Portfólio</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Acompanhe seu patrimônio na B3 com precisão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">alta performance</span>.
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Cálculo de Preço Médio ponderado, acompanhamento de proventos e dividendos, cotações em tempo real e visualização consolidada de Ações e FIIs.
              </p>
            </div>

            {/* Mock do Terminal de Investimentos */}
            <div className="p-5 rounded-2xl bg-[#090d18]/90 border border-white/[0.08] shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_20px_40px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4 max-w-lg">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-slate-300">Portfólio em Tempo Real</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">B3 • Cotações Oficiais</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Patrimônio</span>
                  <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">R$ 142.850,20</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Rentabilidade</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">+14,82%</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Proventos</span>
                  <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">R$ 1.480,00</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  Ações (Lote & Fracionário)
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                  Fundos Imobiliários (FIIs)
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                  Yield on Cost
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 pt-2 border-t border-white/[0.04]">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Segurança HttpOnly & 2FA TOTP
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-4 h-4 text-teal-400" />
                Isolamento Total por Usuário
              </span>
            </div>
          </div>

          {/* Lado Direito: Formulário de Login (Glass Vault Card) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-[#0a0e1a]/95 border border-white/[0.08] rounded-3xl p-7 sm:p-9 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
              
              {/* Glow decorativo interno */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Cabeçalho do Card */}
              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Entrar na Carteira
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Informe suas credenciais para acessar seus investimentos com segurança.
                </p>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Formulário de Login */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="screen-email">
                    E-mail de Acesso
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="screen-email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider" htmlFor="screen-password">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="screen-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Manter Conectado */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.03] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 font-medium">Lembrar de mim (30 dias)</span>
                  </label>
                </div>

                {/* Botão Entrar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_16px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-3"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-white/[0.04]">
                  <span className="text-xs text-slate-500">Novo investidor? </span>
                  <button
                    type="button"
                    onClick={() => setRegisterModalOpen(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Cadastre-se gratuitamente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-[#05070d]/90 py-5 text-center text-xs text-slate-500 font-mono">
        <p>InvestirGo • Plataforma de Gestão de Investimentos, Preço Médio e Proventos (B3 & FIIs)</p>
      </footer>
    </div>
  );
};
