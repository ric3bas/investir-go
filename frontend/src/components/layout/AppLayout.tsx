import React from 'react';
import { Sidebar, TopHeader } from '../Navbar';
import { useRouter } from '../../context/router/RouterContext';

interface AppLayoutProps {
  children: React.ReactNode;
  resumo: any;
  favoritosCount: number;
  totalOperacoes: number;
  onOpenNovaOperacao: () => void;
  onOpenNovoProvento: () => void;
  onOpenLancamentos: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  resumo,
  favoritosCount,
  totalOperacoes,
  onOpenNovaOperacao,
  onOpenNovoProvento,
  onOpenLancamentos,
}) => {
  const { currentRoute, navigate } = useRouter();

  return (
    <div className="theme-shell app-canvas min-h-screen bg-[#05070d] text-slate-100 flex font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <Sidebar
        activeTab={currentRoute}
        setActiveTab={navigate}
        resumo={resumo}
        favoritosCount={favoritosCount}
        totalOperacoes={totalOperacoes}
        onOpenNovaOperacao={onOpenNovaOperacao}
        onOpenNovoProvento={onOpenNovoProvento}
        onOpenLancamentos={onOpenLancamentos}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          activeTab={currentRoute}
          setActiveTab={navigate}
          resumo={resumo}
          favoritosCount={favoritosCount}
          totalOperacoes={totalOperacoes}
          onOpenNovaOperacao={onOpenNovaOperacao}
          onOpenNovoProvento={onOpenNovoProvento}
          onOpenLancamentos={onOpenLancamentos}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
        <footer className="border-t border-white/[0.04] bg-[#070a12]/80 backdrop-blur py-5 text-center text-xs text-slate-500 font-mono">
          <p>InvestirGo • Plataforma Institucional de Gestão de Investimentos</p>
        </footer>
      </div>
    </div>
  );
};
