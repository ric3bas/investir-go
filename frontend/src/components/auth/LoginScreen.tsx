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
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_12px_rgba(16,185,129,0.25)]">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Investir<span className="text-emerald-400">Go</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                B3 & FIIs
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="z-10 mx-auto flex w-full max-w-7xl flex-1 items-start px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:px-8 lg:py-12 xl:py-16">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-20">
          
          {/* Lado Esquerdo: Hero & Demonstração da Plataforma */}
          <div className="hidden lg:col-span-7 lg:block lg:pr-3 xl:pr-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gestão Institucional de Portfólio</span>
              </div>

              <div className="mt-7 space-y-5">
                <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.035em] text-white xl:text-5xl">
                  Acompanhe seu patrimônio na B3 com precisão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">alta performance</span>.
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-slate-400 xl:text-base">
                  Cálculo de Preço Médio ponderado, acompanhamento de proventos e dividendos, cotações em tempo real e visualização consolidada de Ações e FIIs.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/[0.06] pt-5 text-xs text-slate-400 xl:mt-10">
              <span className="flex items-center gap-2 font-medium">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                Segurança HttpOnly & 2FA TOTP
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                  <Layers className="h-3.5 w-3.5" />
                </span>
                Isolamento Total por Usuário
              </span>
            </div>
          </div>

          {/* Lado Direito: Formulário de Login (Glass Vault Card) */}
          <div id="login" className="mx-auto w-full max-w-md lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0e1a]/95 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:rounded-3xl sm:p-8 lg:p-9">
              
              {/* Glow decorativo interno */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Cabeçalho do Card */}
              <div className="mb-6 sm:mb-7">
                <div className="mb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="login-title" className="text-xl font-bold text-white tracking-tight">
                      Entrar na sua conta
                    </h2>
                  </div>
                </div>
                <p className="hidden max-w-sm text-xs leading-5 text-slate-400 sm:block">
                  Informe suas credenciais para acessar seus investimentos com segurança.
                </p>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div role="alert" aria-live="polite" className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Formulário de Login */}
              <form onSubmit={handleLoginSubmit} className="space-y-5" aria-labelledby="login-title">
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
                <div className="flex items-center justify-between pt-0.5">
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
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_16px_rgba(16,185,129,0.3)] transition hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="border-t border-white/[0.06] pt-5 text-center">
                  <span className="text-xs text-slate-500">Ainda não tem uma conta? </span>
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
      <footer className="hidden border-t border-white/[0.04] bg-[#05070d]/90 py-5 text-center font-mono text-xs text-slate-500 sm:block">
        <p>InvestirGo • Plataforma de Gestão de Investimentos, Preço Médio e Proventos (B3 & FIIs)</p>
      </footer>
    </div>
  );
};
