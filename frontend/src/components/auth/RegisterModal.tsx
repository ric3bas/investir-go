import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, Mail, User, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterModal: React.FC = () => {
  const { isRegisterModalOpen, setRegisterModalOpen, setLoginModalOpen, register } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isRegisterModalOpen) return null;

  const handleClose = () => {
    setRegisterModalOpen(false);
    setNome('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(nome, email, password);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 id="register-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Criar Nova Conta
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

        {/* Mensagem de Sucesso */}
        {successMessage ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Conta criada com sucesso!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{successMessage}</p>
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
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reg-nome">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-nome"
                  type="text"
                  autoComplete="name"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu Nome"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reg-email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reg-password">
                Senha (mínimo 8 caracteres)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>

              {/* Barra de Força da Senha */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength <= 25 ? 'bg-rose-500 w-1/4' : strength <= 50 ? 'bg-amber-500 w-2/4' : strength <= 75 ? 'bg-yellow-500 w-3/4' : 'bg-emerald-500 w-full'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Força: {strength <= 25 ? 'Fraca' : strength <= 50 ? 'Média' : strength <= 75 ? 'Boa' : 'Excelente'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="reg-confirm">
                Confirmar Senha
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Criar Conta</span>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Já tem uma conta? </span>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setLoginModalOpen(true);
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Faça login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
