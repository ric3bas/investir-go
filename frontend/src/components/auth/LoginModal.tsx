import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, KeyRound, AlertCircle, LogIn } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setLoginModalOpen,
    setRegisterModalOpen,
    setForgotModalOpen,
    login,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    setLoginModalOpen(false);
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
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
              <Lock className="w-5 h-5" />
            </div>
            <h2 id="login-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Entrar no InvestirGo
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

        {/* Formulário de Login */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
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

          {/* Opção Manter Conectado / Lembrar de mim */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Lembrar de mim (manter conectado)
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </>
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
      </div>
    </div>
  );
};
