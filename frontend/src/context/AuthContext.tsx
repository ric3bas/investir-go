import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse } from '../types/auth';
import { AuthService, subscribeAuthState } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (mfaToken: string, code: string, isRecoveryCode?: boolean) => Promise<LoginResponse>;
  register: (nome: string, email: string, password: string) => Promise<{ message: string; verificationToken?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  // Modais de Controle
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  isRegisterModalOpen: boolean;
  setRegisterModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  isSecurityModalOpen: boolean;
  setSecurityModalOpen: (open: boolean) => void;
  isForgotModalOpen: boolean;
  setForgotModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modais
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setSecurityModalOpen] = useState(false);
  const [isForgotModalOpen, setForgotModalOpen] = useState(false);

  useEffect(() => {
    // Inscreve-se nas mudanças de estado do AuthService
    const unsubscribe = subscribeAuthState((updatedUser) => {
      setUser(updatedUser);
    });

    // Tentativa inicial silenciosa de renovar autenticação via cookie HttpOnly
    const initAuth = async () => {
      try {
        await AuthService.initCsrf();
        const token = await AuthService.refresh();
        if (token) {
          await AuthService.getCurrentUser();
        }
      } catch {
        // Sem sessão ativa no carregamento inicial
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setError(null);
    try {
      const res = await AuthService.login(email, password);
      if (!res.requiresMfa && res.user) {
        setUser(res.user);
        setLoginModalOpen(false);
      }
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Falha ao autenticar. Verifique suas credenciais.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyMfa = async (mfaToken: string, code: string, isRecoveryCode = false): Promise<LoginResponse> => {
    setError(null);
    try {
      const res = await AuthService.verifyMfa(mfaToken, code, isRecoveryCode);
      if (res.user) {
        setUser(res.user);
        setLoginModalOpen(false);
      }
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Código MFA inválido.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (nome: string, email: string, password: string) => {
    setError(null);
    try {
      const res = await AuthService.register(nome, email, password);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Falha no cadastro.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
      setProfileModalOpen(false);
      setSecurityModalOpen(false);
    }
  };

  const logoutAll = async () => {
    try {
      await AuthService.logoutAll();
    } finally {
      setUser(null);
      setProfileModalOpen(false);
      setSecurityModalOpen(false);
    }
  };

  const refreshUser = async () => {
    const updated = await AuthService.getCurrentUser();
    setUser(updated);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        loading,
        error,
        login,
        verifyMfa,
        register,
        logout,
        logoutAll,
        refreshUser,
        clearError,
        isLoginModalOpen,
        setLoginModalOpen,
        isRegisterModalOpen,
        setRegisterModalOpen,
        isProfileModalOpen,
        setProfileModalOpen,
        isSecurityModalOpen,
        setSecurityModalOpen,
        isForgotModalOpen,
        setForgotModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
