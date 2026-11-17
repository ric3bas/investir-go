import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/authService';
import { MfaSetupData } from '../../types/auth';
import { X, Shield, KeyRound, Smartphone, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';

export const SecuritySettingsModal: React.FC = () => {
  const { user, isSecurityModalOpen, setSecurityModalOpen, refreshUser } = useAuth();

  // Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Configuração de MFA (TOTP)
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupData | null>(null);
  const [confirmTotpCode, setConfirmTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  if (!isSecurityModalOpen || !user) return null;

  const handleClose = () => {
    setSecurityModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordMsg(null);
    setMfaSetupData(null);
    setConfirmTotpCode('');
    setMfaMsg(null);
    setShowDisableForm(false);
    setDisablePassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'A confirmação da nova senha não confere.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve possuir pelo menos 8 caracteres.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await AuthService.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Falha ao alterar senha.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleStartMfaSetup = async () => {
    setMfaLoading(true);
    setMfaMsg(null);
    try {
      const data = await AuthService.setupMfa();
      setMfaSetupData(data);
    } catch (err: any) {
      setMfaMsg({ type: 'error', text: err.response?.data?.message || 'Falha ao iniciar configuração de MFA.' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMsg(null);

    try {
      const res = await AuthService.confirmMfa(confirmTotpCode.trim());
      setMfaMsg({ type: 'success', text: res.message });
      setMfaSetupData(null);
      setConfirmTotpCode('');
      await refreshUser();
    } catch (err: any) {
      setMfaMsg({ type: 'error', text: err.response?.data?.message || 'Código TOTP incorreto.' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaMsg(null);

    try {
      const res = await AuthService.disableMfa(disablePassword);
      setMfaMsg({ type: 'success', text: res.message });
      setShowDisableForm(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      setMfaMsg({ type: 'error', text: err.response?.data?.message || 'Senha incorreta para desativação.' });
    } finally {
      setMfaLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    if (!mfaSetupData) return;
    navigator.clipboard.writeText(mfaSetupData.recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h2 id="security-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Configurações de Segurança
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

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Seção 1: Alteração de Senha com Reautenticação */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Alterar Senha</h3>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1" htmlFor="curr-pass">
                  Senha Atual (Reautenticação)
                </label>
                <input
                  id="curr-pass"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1" htmlFor="new-pass">
                    Nova Senha
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1" htmlFor="conf-new-pass">
                    Confirmar Nova Senha
                  </label>
                  <input
                    id="conf-new-pass"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {passwordLoading ? 'Alterando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </section>

          {/* Seção 2: Autenticação em Duas Etapas (MFA / TOTP) */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Autenticação em Duas Etapas (TOTP RFC 6238)
              </h3>
            </div>

            {mfaMsg && (
              <div
                className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${
                  mfaMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {mfaMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{mfaMsg.text}</span>
              </div>
            )}

            {user.role === 'Admin' && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                <strong>Atenção Administrador:</strong> O MFA por TOTP é obrigatório por política estrita de segurança para todos os usuários com perfil de Administrador.
              </div>
            )}

            {!user.totpEnabled && !mfaSetupData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">MFA não está configurado</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Proteja sua conta adicionando uma camada extra de segurança com Google Authenticator ou Authy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartMfaSetup}
                  disabled={mfaLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-all shadow-sm"
                >
                  {mfaLoading ? 'Iniciando...' : 'Ativar MFA'}
                </button>
              </div>
            )}

            {/* Fluxo de Ativação de MFA com QR Code e Códigos de Recuperação */}
            {mfaSetupData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  1. Escaneie o código QR abaixo com seu aplicativo autenticador ou insira a chave secreta manualmente.
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img
                    src={`data:image/png;base64,${mfaSetupData.qrCodeBase64}`}
                    alt="QR Code TOTP"
                    className="w-36 h-36 rounded-lg border border-slate-100 dark:border-slate-800"
                  />
                  <div className="space-y-2 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Chave secreta manual:</span>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-[11px] select-all break-all text-emerald-600 dark:text-emerald-400">
                      {mfaSetupData.secret}
                    </div>
                  </div>
                </div>

                {/* Códigos de Recuperação */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      2. Guarde seus Códigos de Recuperação (uso único):
                    </span>
                    <button
                      type="button"
                      onClick={copyRecoveryCodes}
                      className="flex items-center space-x-1 text-emerald-600 hover:underline text-[11px]"
                    >
                      {copiedCodes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCodes ? 'Copiados!' : 'Copiar Códigos'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl font-mono text-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {mfaSetupData.recoveryCodes.map((code, idx) => (
                      <span key={idx} className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200/50 dark:border-slate-700">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confirmação do Código */}
                <form onSubmit={handleConfirmMfa} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="totp-confirm">
                      3. Insira o código de 6 dígitos gerado pelo aplicativo para ativar:
                    </label>
                    <input
                      id="totp-confirm"
                      type="text"
                      maxLength={6}
                      required
                      value={confirmTotpCode}
                      onChange={(e) => setConfirmTotpCode(e.target.value.trim())}
                      placeholder="000000"
                      className="w-full sm:w-48 px-4 py-2 font-mono text-center text-base tracking-widest font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={mfaLoading || confirmTotpCode.length !== 6}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                      {mfaLoading ? 'Validando...' : 'Ativar Definitivamente'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMfaSetupData(null)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MFA Já Ativado */}
            {user.totpEnabled && (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold text-xs">MFA Ativo e Protegendo sua Conta</span>
                  </div>
                  {user.role !== 'Admin' && (
                    <button
                      type="button"
                      onClick={() => setShowDisableForm(!showDisableForm)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      {showDisableForm ? 'Cancelar' : 'Desativar MFA'}
                    </button>
                  )}
                </div>

                {showDisableForm && user.role !== 'Admin' && (
                  <form onSubmit={handleDisableMfa} className="pt-3 border-t border-emerald-200 dark:border-emerald-800 space-y-3">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Para desativar a autenticação em duas etapas, confirme sua senha atual:
                    </p>
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full sm:w-64 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <div>
                      <button
                        type="submit"
                        disabled={mfaLoading}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl"
                      >
                        {mfaLoading ? 'Processando...' : 'Confirmar Desativação'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
