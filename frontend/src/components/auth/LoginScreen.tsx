import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  Cpu,
  Fingerprint,
  RefreshCw,
  Coins,
  BarChart3,
  Sparkles
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    login,
    verifyMfa,
    setRegisterModalOpen,
    setForgotModalOpen,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do Desafio MFA
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.requiresMfa && res.mfaToken) {
        setMfaToken(res.mfaToken);
        setIsMfaStep(true);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verifyMfa(mfaToken, mfaCode, isRecoveryCode);
    } catch (err: any) {
      setError(err.message || 'Código de verificação incorreto ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (tipo: 'user' | 'admin') => {
    setError(null);
    if (tipo === 'user') {
      setEmail('usuario@investirgo.com');
      setPassword('User@InvestirGo2026!');
    } else {
      setEmail('admin@investirgo.com');
      setPassword('Admin@InvestirGo2026!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header Simplificado */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Não possui conta?</span>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Lado Esquerdo: Benefícios & Apresentação da Plataforma */}
          <div className="lg:col-span-6 space-y-6 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ambiente Protegido e Criptografado</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight">
                Gestão Inteligente de{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Investimentos
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Acesse sua carteira consolidada, acompanhe seu preço médio na B3, registre compras e vendas e visualize seus proventos em um único lugar seguro.
              </p>
            </div>

            {/* Destaques da Plataforma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Preço Médio Real</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cálculo contínuo conforme compras e vendas.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Mapa de Proventos</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dividendos, JCP e rendimentos de FIIs.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Argon2id & OWASP</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Senhas com hash de máxima segurança.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">MFA com TOTP</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Autenticação em duas etapas por aplicativo.</p>
                </div>
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

          {/* Lado Direito: Card de Login & Desafio MFA */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur relative overflow-hidden">
              
              {/* Efeito Glow decorativo */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Cabeçalho do Card */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    {isMfaStep ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">
                    {isMfaStep ? 'Verificação em Duas Etapas' : 'Entrar na Plataforma'}
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  {isMfaStep
                    ? 'Confirme sua identidade com o código gerado no seu autenticador.'
                    : 'Acesse suas credenciais seguras para desbloquear a sua carteira.'}
                </p>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Passo 1: Formulário de Credenciais */}
              {!isMfaStep ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Botões de Acesso Rápido para Testes */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                    <span className="font-semibold text-slate-300 block mb-2 text-[11px] uppercase tracking-wider">
                      Contas para Teste Imediato:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fillQuickAccount('user')}
                        className="p-2.5 text-left rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition group"
                      >
                        <p className="font-bold text-slate-200 text-xs group-hover:text-emerald-400">Investidor</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">usuario@investirgo.com</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillQuickAccount('admin')}
                        className="p-2.5 text-left rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition group"
                      >
                        <p className="font-bold text-slate-200 text-xs group-hover:text-emerald-400">Admin (MFA)</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">admin@investirgo.com</p>
                      </button>
                    </div>
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
                        <Shield className="w-4 h-4" />
                        <span>Acessar Carteira</span>
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
              ) : (
                /* Passo 2: Formulário Desafio MFA */
                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
                    {isRecoveryCode ? (
                      <p>
                        Digite um código de recuperação cadastrado. Para o Admin de teste: <span className="font-mono font-bold text-amber-400">admin-00001</span>.
                      </p>
                    ) : (
                      <p>
                        Abra o seu aplicativo autenticador (Google Authenticator, Authy) e digite o código de 6 dígitos.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="screen-mfa-code">
                      {isRecoveryCode ? 'Código de Recuperação (10 caracteres)' : 'Código TOTP (6 dígitos)'}
                    </label>
                    <input
                      id="screen-mfa-code"
                      type="text"
                      autoComplete="one-time-code"
                      autoFocus
                      required
                      maxLength={isRecoveryCode ? 12 : 6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.trim())}
                      placeholder={isRecoveryCode ? 'admin-00001' : '000000'}
                      className="w-full px-4 py-3 text-center tracking-widest font-mono text-xl font-black bg-slate-950/80 border border-slate-800 rounded-xl text-emerald-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryCode(!isRecoveryCode);
                        setMfaCode('');
                      }}
                      className="text-emerald-400 hover:underline"
                    >
                      {isRecoveryCode ? 'Usar código temporário TOTP' : 'Não tem acesso ao app? Usar código de recuperação'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !mfaCode}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-900/30 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validando Código...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirmar e Entrar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMfaStep(false);
                      setMfaCode('');
                      setError(null);
                    }}
                    className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 flex items-center justify-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para senha</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>InvestirGo • Plataforma Segura de Gestão de Investimentos, Preço Médio e Proventos (B3 & FIIs)</p>
      </footer>
    </div>
  );
};
