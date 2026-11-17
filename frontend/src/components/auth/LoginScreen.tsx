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
  Shield,
  CheckCircle2,
  RefreshCw,
  Coins,
  BarChart3,
  Sparkles,
  LogIn
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = () => {
    setError(null);
    setEmail('usuario@investirgo.com');
    setPassword('User@InvestirGo2026!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Topo / Navbar simplificada de autenticação */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Investir<span className="text-emerald-400">Go</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                B3 & FIIs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30 rounded-xl transition"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Lado Esquerdo: Apresentação da Plataforma */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gestão Completa de Ações e Fundos Imobiliários</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Controle seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">investimentos</span> com precisão e segurança.
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Acesse sua carteira consolidada, acompanhe seu preço médio na B3, registre compras e vendas e visualize seus proventos em um único lugar seguro.
              </p>
            </div>

            {/* Destaques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">Cálculo de Preço Médio</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Atualização automática a cada compra ou venda conforme as regras fiscais da B3.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">Proventos & Dividendos</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Acompanhe dividendos, JCP e rendimentos de FIIs provisionados e pagos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-900">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Sessão em Memória
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Cookie HttpOnly
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Proteção CSRF
              </span>
            </div>
          </div>

          {/* Lado Direito: Card de Login */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur relative overflow-hidden">
              
              {/* Efeito Glow decorativo */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Cabeçalho do Card */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">
                    Entrar na Plataforma
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Acesse com seu e-mail e senha para desbloquear sua carteira.
                </p>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Formulário de Credenciais */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Botão de Acesso Rápido para Testes */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
                      Conta para Teste Imediato:
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">usuario@investirgo.com</p>
                  </div>
                  <button
                    type="button"
                    onClick={fillQuickAccount}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition text-emerald-400 font-bold text-xs"
                  >
                    Preencher
                  </button>
                </div>

                {/* Campo E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="screen-email">
                    E-mail
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="screen-password">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
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
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition font-mono"
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

                {/* Botão Entrar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Entrar na Carteira</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">Ainda não tem conta no InvestirGo? </span>
                  <button
                    type="button"
                    onClick={() => setRegisterModalOpen(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Cadastre-se grátis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>InvestirGo • Plataforma de Gestão de Investimentos, Preço Médio e Proventos (B3 & FIIs)</p>
      </footer>
    </div>
  );
};
