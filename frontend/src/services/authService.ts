import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { User, UserSession, LoginResponse, MfaSetupData, AuditLogItem } from '../types/auth';

// O token de acesso NUNCA é armazenado em localStorage, sessionStorage ou IndexedDB
// Ele reside estritamente em memória volátil de JavaScript (fechamento de módulo)
let inMemoryAccessToken: string | null = null;
let inMemoryUser: User | null = null;
let inMemoryCsrfToken: string | null = null;

// Controle de concorrência para renovação coordenada de refresh token (evita tempestade de refresh)
let refreshPromise: Promise<string | null> | null = null;

// Callbacks para notificação de perda de sessão ou mudança de estado
type AuthStateListener = (user: User | null) => void;
const listeners: Set<AuthStateListener> = new Set();

export const subscribeAuthState = (listener: AuthStateListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyAuthState = (user: User | null) => {
  listeners.forEach((fn) => fn(user));
};

export const getCsrfTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// Cliente Axios dedicado para requisições de autenticação e API protegida
export const authClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Essencial para envio e recebimento de cookies HttpOnly SameSite
});

// Interceptor de Requisição: anexa Authorization Bearer (se em memória) e X-CSRF-Token
authClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryAccessToken) {
    config.headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const csrfToken = inMemoryCsrfToken || getCsrfTokenFromCookie();
  if (csrfToken) {
    config.headers.set('X-CSRF-Token', csrfToken);
  }

  return config;
});

// Interceptor de Resposta: renovação atômica em caso de 401 para requisições idempotentes (GET)
authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Evita loop infinito em caso de 401 no próprio endpoint de refresh ou login
    if (!originalRequest || originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await AuthService.refresh();
        if (newAccessToken) {
          originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);

          // Apenas repete requisições seguras e idempotentes (GET, HEAD, OPTIONS)
          // Operações de mutação (POST/PUT/DELETE) exigem revalidação do usuário para não duplicar efeitos colaterais
          const method = (originalRequest.method || 'GET').toUpperCase();
          if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return authClient(originalRequest);
          }
        }
      } catch (refreshErr) {
        AuthService.clearSession();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export const AuthService = {
  getAccessToken: (): string | null => inMemoryAccessToken,
  getUser: (): User | null => inMemoryUser,

  setAccessToken: (token: string | null) => {
    inMemoryAccessToken = token;
  },

  clearSession: () => {
    inMemoryAccessToken = null;
    inMemoryUser = null;
    refreshPromise = null;
    localStorage.removeItem('investir_remember_me');
    localStorage.removeItem('investir_user_email');
    notifyAuthState(null);
  },

  // Obtém ou renova token CSRF
  initCsrf: async (): Promise<string> => {
    try {
      const { data } = await authClient.get('/auth/csrf');
      if (data?.csrfToken) {
        inMemoryCsrfToken = data.csrfToken;
      }
      return data?.csrfToken || '';
    } catch {
      return '';
    }
  },

  // 1. Cadastro
  register: async (nome: string, email: string, password: string): Promise<{ message: string; verificationToken?: string }> => {
    const { data } = await authClient.post('/auth/register', { nome, email, password });
    return data;
  },

  // 2. Verificação de E-mail
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const { data } = await authClient.post('/auth/verify-email', { token });
    return data;
  },

  // 3. Login
  login: async (email: string, password: string, rememberMe = true): Promise<LoginResponse> => {
    await AuthService.initCsrf();
    const { data } = await authClient.post<LoginResponse>('/auth/login', { email, password, rememberMe });

    if (!data.requiresMfa && data.accessToken && data.user) {
      inMemoryAccessToken = data.accessToken;
      inMemoryUser = data.user;
      if (rememberMe) {
        localStorage.setItem('investir_remember_me', 'true');
        localStorage.setItem('investir_user_email', data.user.email);
      } else {
        localStorage.removeItem('investir_remember_me');
        localStorage.removeItem('investir_user_email');
      }
      notifyAuthState(data.user);
    }

    return data;
  },

  // 4. Verificação de Desafio MFA
  verifyMfa: async (mfaToken: string, code: string, isRecoveryCode = false): Promise<LoginResponse> => {
    const { data } = await authClient.post<LoginResponse>('/auth/mfa/verify', {
      mfaToken,
      code,
      isRecoveryCode,
    });

    if (data.accessToken && data.user) {
      inMemoryAccessToken = data.accessToken;
      inMemoryUser = data.user;
      notifyAuthState(data.user);
    }

    return data;
  },

  // 5. Consulta do Usuário Autenticado
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data } = await authClient.get<User>('/auth/me');
      inMemoryUser = data;
      notifyAuthState(data);
      return data;
    } catch {
      return null;
    }
  },

  // 6. Renovação Coordenada da Autenticação
  refresh: async (): Promise<string | null> => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        await AuthService.initCsrf();
        const { data } = await authClient.post<{ accessToken: string; user: User }>('/auth/refresh');
        inMemoryAccessToken = data.accessToken;
        inMemoryUser = data.user;
        if (data.user) {
          localStorage.setItem('investir_user_email', data.user.email);
        }
        notifyAuthState(data.user);
        return data.accessToken;
      } catch {
        AuthService.clearSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  // 7. Logout da Sessão Atual
  logout: async (): Promise<void> => {
    try {
      await authClient.post('/auth/logout');
    } finally {
      AuthService.clearSession();
    }
  },

  // 8. Logout de Todas as Sessões
  logoutAll: async (): Promise<void> => {
    try {
      await authClient.post('/auth/logout-all');
    } finally {
      AuthService.clearSession();
    }
  },

  // 9. Listagem de Sessões Ativas
  getSessions: async (): Promise<UserSession[]> => {
    const { data } = await authClient.get<UserSession[]>('/auth/sessions');
    return data;
  },

  // 10. Revogação de Sessão Específica
  revokeSession: async (sessionId: string): Promise<void> => {
    await authClient.delete(`/auth/sessions/${sessionId}`);
  },

  // 11. Solicitação de Redefinição de Senha
  forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string }> => {
    const { data } = await authClient.post('/auth/forgot-password', { email });
    return data;
  },

  // 12. Redefinição de Senha
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await authClient.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  // 13. Alteração de Senha com Reautenticação
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await authClient.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  // 14. Configuração de MFA (TOTP)
  setupMfa: async (): Promise<MfaSetupData> => {
    const { data } = await authClient.post<MfaSetupData>('/auth/mfa/setup');
    return data;
  },

  confirmMfa: async (code: string): Promise<{ message: string }> => {
    const { data } = await authClient.post('/auth/mfa/confirm', { code });
    return data;
  },

  disableMfa: async (password: string): Promise<{ message: string }> => {
    const { data } = await authClient.post('/auth/mfa/disable', { password });
    return data;
  },

  // 15. Administração de Usuários & Auditoria
  getAdminUsers: async (): Promise<User[]> => {
    const { data } = await authClient.get<User[]>('/admin/users');
    return data;
  },

  setAdminUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
    await authClient.put(`/admin/users/${userId}/status`, isActive, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  getAuditLogs: async (): Promise<AuditLogItem[]> => {
    const { data } = await authClient.get<AuditLogItem[]>('/admin/audit-logs');
    return data;
  },
};
