import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  esconderValores: boolean;
  toggleEsconderValores: () => void;
  formatarValor: (
    valor: number | string | null | undefined,
    options?: {
      mascara?: string;
      style?: 'currency' | 'decimal';
      currency?: string;
      prefixo?: string;
      sufixo?: string;
    }
  ) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [esconderValores, setEsconderValores] = useState<boolean>(() => {
    try {
      const salvo = localStorage.getItem('investirgo_esconder_valores');
      return salvo === 'true';
    } catch {
      return false;
    }
  });

  const toggleEsconderValores = () => {
    setEsconderValores((prev) => {
      const novo = !prev;
      try {
        localStorage.setItem('investirgo_esconder_valores', String(novo));
      } catch {}
      return novo;
    });
  };

  const formatarValor = (
    valor: number | string | null | undefined,
    options?: {
      mascara?: string;
      style?: 'currency' | 'decimal';
      currency?: string;
      prefixo?: string;
      sufixo?: string;
    }
  ): string => {
    if (valor === null || valor === undefined) return '-';

    if (esconderValores) {
      return options?.mascara || 'R$ ••••••••';
    }

    if (typeof valor === 'string') {
      return `${options?.prefixo || ''}${valor}${options?.sufixo || ''}`;
    }

    const formatado = valor.toLocaleString('pt-BR', {
      style: options?.style || 'currency',
      currency: options?.currency || 'BRL',
    });

    return `${options?.prefixo || ''}${formatado}${options?.sufixo || ''}`;
  };

  return (
    <PrivacyContext.Provider value={{ esconderValores, toggleEsconderValores, formatarValor }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy deve ser usado dentro de um PrivacyProvider');
  }
  return context;
};
