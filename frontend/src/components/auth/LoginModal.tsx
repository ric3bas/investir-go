import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, ShieldCheck, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setLoginModalOpen,
    setRegisterModalOpen,
    setForgotModalOpen,
    login,
    verifyMfa,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do Desafio MFA
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    setLoginModalOpen(false);
    setIsMfaStep(false);
    setEmail('');
    setPassword('');
    setMfaCode('');
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.requiresMfa && res.mfaToken) {
        setMfaToken(res.mfaToken);
        setIsMfaStep(true);
      } else {
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
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
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Código de verificação incorreto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              {isMfaStep ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <h2 id="login-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isMfaStep ? 'Verificação em Duas Etapas' : 'Entrar no InvestirGo'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start space-x-2 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário Passo 1: Credenciais */}
        {!isMfaStep ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {/* Contas Pré-configuradas para Teste */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Contas para Acesso Rápido:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('usuario@investirgo.com');
                    setPassword('User@InvestirGo2026!');
                  }}
                  className="p-2 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">Investidor Comum</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">usuario@investirgo.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@investirgo.com');
                    setPassword('Admin@InvestirGo2026!');
                  }}
                  className="p-2 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">Administrador (MFA)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">admin@investirgo.com</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="login-email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" htmlFor="login-password">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setForgotModalOpen(true);
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Entrar com Segurança</span>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Não possui uma conta? </span>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setRegisterModalOpen(true);
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </div>
          </form>
        ) : (
          /* Formulário Passo 2: Desafio MFA */
          <form onSubmit={handleMfaSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isRecoveryCode
                ? 'Insira um dos códigos de recuperação (ex: admin-00001, admin-00002).'
                : 'Abra o seu aplicativo autenticador (TOTP) ou clique abaixo para usar código de recuperação.'}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="mfa-code">
                {isRecoveryCode ? 'Código de Recuperação (10 caracteres)' : 'Código de Autenticação TOTP'}
              </label>
              <input
                id="mfa-code"
                type="text"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={isRecoveryCode ? 12 : 6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.trim())}
                placeholder={isRecoveryCode ? 'xxxxx-xxxxx' : '000000'}
                className="w-full px-4 py-3 text-center tracking-widest font-mono text-lg font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setIsRecoveryCode(!isRecoveryCode)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isRecoveryCode ? 'Usar código do aplicativo TOTP' : 'Não tem acesso ao celular? Use código de recuperação'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Confirmar e Acessar</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMfaStep(false)}
              className="w-full text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1 flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao login com e-mail</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
