import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/authService';
import { X, KeyRound, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ForgotPasswordModal: React.FC = () => {
  const { isForgotModalOpen, setForgotModalOpen, setLoginModalOpen } = useAuth();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isForgotModalOpen) return null;

  const handleClose = () => {
    setForgotModalOpen(false);
    setEmail('');
    setToken('');
    setNewPassword('');
    setStep('request');
    setError(null);
    setInfoMessage(null);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await AuthService.forgotPassword(email);
      setInfoMessage(res.message);
      if (res.resetToken) {
        setToken(res.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Falha ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('A nova senha deve possuir pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(token, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Token inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 id="forgot-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Recuperar Senha
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

        {step === 'request' && (
          <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Informe seu e-mail cadastrado para receber instruções seguras de redefinição de senha.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="forgot-email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Enviar Instruções</span>
              )}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
            {infoMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs leading-relaxed">
                {infoMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reset-token">
                Token de Recuperação
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                placeholder="Insira o token recebido"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reset-new-password">
                Nova Senha (mínimo 8 caracteres)
              </label>
              <input
                id="reset-new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Redefinir Senha</span>
              )}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Senha redefinida com sucesso!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Todas as sessões anteriores foram invalidadas por segurança. Faça login com sua nova senha.
            </p>
            <button
              onClick={() => {
                handleClose();
                setLoginModalOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all"
            >
              Ir para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
