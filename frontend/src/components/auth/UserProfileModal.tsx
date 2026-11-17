import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/authService';
import { UserSession } from '../../types/auth';
import { X, User, Laptop, Globe, Clock, ShieldCheck, LogOut, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { user, isProfileModalOpen, setProfileModalOpen, setSecurityModalOpen, logout, logoutAll } = useAuth();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (isProfileModalOpen) {
      loadSessions();
    }
  }, [isProfileModalOpen]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError(null);
    try {
      const data = await AuthService.getSessions();
      setSessions(data);
    } catch {
      setError('Falha ao carregar sessões ativas.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await AuthService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setError('Não foi possível revogar a sessão.');
    } finally {
      setRevokingId(null);
    }
  };

  if (!isProfileModalOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <h2 id="profile-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Perfil e Sessões
            </h2>
          </div>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dados do Usuário */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{user.nome}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'Admin'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    user.totpEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {user.totpEnabled ? 'MFA Ativo' : 'MFA Inativo'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-500">Membro desde: {new Date(user.createdAt).toLocaleDateString()}</span>
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  setSecurityModalOpen(true);
                }}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Gerenciar Segurança e MFA &rarr;
              </button>
            </div>
          </div>

          {/* Gerenciamento de Sessões Ativas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Dispositivos e Sessões Ativas</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sessões autenticadas via refresh token criptograficamente seguro com rotação atômica.
                </p>
              </div>
              <button
                onClick={loadSessions}
                disabled={loadingSessions}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Atualizar sessões"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSessions ? (
              <div className="p-8 text-center text-slate-400 text-sm">Carregando sessões ativas...</div>
            ) : sessions.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center text-xs text-slate-500">
                Nenhuma sessão ativa encontrada.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-200/70 dark:bg-slate-700/60 rounded-lg text-slate-700 dark:text-slate-300 mt-0.5">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                            {session.userAgent || 'Navegador Web'}
                          </span>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full">
                              Esta sessão
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>IP: {session.ipAddress || '127.0.0.1'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Ativo: {new Date(session.lastActiveAt).toLocaleTimeString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokingId === session.id}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-2 shrink-0"
                        title="Encerrar esta sessão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Ações de Logout */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <button
            onClick={logoutAll}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Encerrar Todas as Sessões
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-medium rounded-xl transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair desta Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
