import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/authService';
import { User, AuditLogItem } from '../../types/auth';
import { ShieldAlert, Users, History, CheckCircle, XCircle, AlertTriangle, RefreshCw, Power } from 'lucide-react';

export const AdminPanelTab: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'logs'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'Admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, logsData] = await Promise.all([
        AuthService.getAdminUsers(),
        AuthService.getAuditLogs(),
      ]);
      setUsers(usersData);
      setLogs(logsData);
    } catch (err: any) {
      setError('Falha ao carregar dados administrativos. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    setTogglingId(targetUser.id);
    const newStatus = !(targetUser as any).isActive;
    try {
      await AuthService.setAdminUserStatus(targetUser.id, newStatus);
      await loadData();
    } catch {
      setError('Não foi possível alterar o status do usuário.');
    } finally {
      setTogglingId(null);
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Acesso Restrito</h3>
        <p className="text-xs text-slate-500 mt-1">
          Você não possui privilégios de Administrador para acessar este painel. Toda tentativa não autorizada é registrada nos logs de auditoria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Painel Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <span>Painel de Segurança e Governança</span>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs rounded-full font-bold">
              Admin Only
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão de contas, revogação em tempo real e monitoramento de logs de auditoria de segurança.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeSubTab === 'users'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuários ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Logs ({logs.length})</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center space-x-2 text-rose-700 dark:text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conteúdo: Tabela de Usuários */}
      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Nome / E-mail</th>
                  <th className="px-6 py-3.5">Perfil</th>
                  <th className="px-6 py-3.5">MFA TOTP</th>
                  <th className="px-6 py-3.5">E-mail Validado</th>
                  <th className="px-6 py-3.5">Data de Criação</th>
                  <th className="px-6 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{u.nome}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          u.role === 'Admin'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.totpEnabled
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {u.totpEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.emailVerified ? (
                        <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verificado</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-amber-500 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={togglingId === u.id}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors inline-flex items-center space-x-1"
                        >
                          <Power className="w-3 h-3" />
                          <span>Alternar Status</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo: Logs de Auditoria */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Data / Hora</th>
                  <th className="px-6 py-3.5">Ação</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">IP de Origem</th>
                  <th className="px-6 py-3.5">Detalhes Sanitizados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : log.status === 'SUSPICIOUS'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
