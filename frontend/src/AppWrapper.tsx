import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useRouter } from './context/router/RouterContext';
import { DashboardPage } from './pages/DashboardPage';

import { useAuth } from './context/AuthContext';
import { InvestirApi } from './services/api';
import { Ativo, Operacao, Provento, PosicaoCarteira, ResumoCarteira } from './types';
import { getFavoritos, toggleFavorito, isFavorito, TOP_30_ATIVOS } from './utils/marketData';
import { RefreshCw } from 'lucide-react';
import { LoginScreen } from './components/auth/LoginScreen';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { SecuritySettingsModal } from './components/auth/SecuritySettingsModal';
import { CarteiraTab } from './components/CarteiraTab';
import { PerformanceTab } from './components/PerformanceTab';
import { NoticiasFavoritosTab } from './components/NoticiasFavoritosTab';
import { ProventosTab } from './components/ProventosTab';
import { AdminPanelTab } from './components/auth/AdminPanelTab';
import { AtivoDetalhesModal } from './components/AtivoDetalhesModal';
import { LancamentosModal } from './components/LancamentosModal';
import { NovaOperacaoModal } from './components/NovaOperacaoModal';
import { NovoProventoModal } from './components/NovoProventoModal';
import { NovoAtivoModal } from './components/NovoAtivoModal';

export const AppWrapper: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { currentRoute, navigate } = useRouter();

  // ... (All original state and handlers from App.tsx go here)
  const [resumo, setResumo] = useState<ResumoCarteira | null>(null);
  const [posicoes, setPosicoes] = useState<PosicaoCarteira[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>(TOP_30_ATIVOS);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoPrecos, setCarregandoPrecos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modais
  const [modalOperacaoOpen, setModalOperacaoOpen] = useState(false);
  const [modalProventoOpen, setModalProventoOpen] = useState(false);
  const [modalLancamentosOpen, setModalLancamentosOpen] = useState(false);
  const [modalAtivoOpen, setModalAtivoOpen] = useState(false);
  const [modalAtivoDados, setModalAtivoDados] = useState<any>();
  const [modalTicker, setModalTicker] = useState<string | undefined>();
  const [modalTipoOperacao, setModalTipoOperacao] = useState<'COMPRA' | 'VENDA'>('COMPRA');
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);
  const [noticiasTickerFiltro, setNoticiasTickerFiltro] = useState<string | undefined>();

  useEffect(() => {
    setFavoritos(getFavoritos());
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resumoData, posicoesData, operacoesData, proventosData, ativosData] = await Promise.all([
        InvestirApi.getResumo(),
        InvestirApi.getPosicoes(),
        InvestirApi.getOperacoes(),
        InvestirApi.getProventos(),
        InvestirApi.getAtivos(),
      ]);
      setResumo(resumoData);
      setPosicoes(posicoesData);
      setOperacoes(operacoesData);
      setProventos(proventosData);
      setAtivos(ativosData);
      await handleAtualizarPrecos();
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Houve uma falha de conexão com a API. Dados em modo de contingência local.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      carregarDados();
    } else {
      setResumo(null);
      setPosicoes([]);
      setOperacoes([]);
      setProventos([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleToggleFavorito = (ticker: string) => {
    const novos = toggleFavorito(ticker);
    setFavoritos([...novos]);
  };

  const handleSelectAtivo = (ativo: Ativo) => {
    setSelectedAtivo(ativo);
    setModalDetalhesOpen(true);
  };

  const handleOpenNovaOperacao = (defaultTicker?: string, defaultTipo: 'COMPRA' | 'VENDA' = 'COMPRA') => {
    setModalTicker(defaultTicker || undefined);
    setModalTipoOperacao(defaultTipo || 'COMPRA');
    setModalOperacaoOpen(true);
  };

  const handleOpenNovoProvento = (defaultTicker?: string) => {
    setModalTicker(defaultTicker);
    setModalProventoOpen(true);
  };

  const handleCriarOperacao = async (data: any) => {
    await InvestirApi.criarOperacao(data);
    await carregarDados();
  };

  const handleExcluirOperacao = async (id: number) => {
    await InvestirApi.excluirOperacao(id);
    await carregarDados();
  };

  const handleCriarProvento = async (data: any) => {
    await InvestirApi.criarProvento(data);
    await carregarDados();
  };

  const handleExcluirProvento = async (id: number) => {
    await InvestirApi.excluirProvento(id);
    await carregarDados();
  };

  const handleAtualizarPrecos = async () => {
    setCarregandoPrecos(true);
    try {
      const [posicoesData, ativosData] = await Promise.all([
        InvestirApi.getPosicoes(),
        InvestirApi.getAtivos(),
      ]);
      setPosicoes(posicoesData);
      setAtivos(ativosData);
    } catch (err) {
      console.error('Erro ao atualizar preços:', err);
    } finally {
      setCarregandoPrecos(false);
    }
  };

  const handleCadastrarAtivo = async (data: any) => {
    await InvestirApi.criarAtivo(data);
    await carregarDados();
  };

  const handleOpenCadastrarAtivo = (dados?: any) => {
    setModalAtivoDados(dados);
    setModalAtivoOpen(true);
  };

  const handleNavigateToNoticias = (ticker?: string) => {
    setNoticiasTickerFiltro(ticker);
    navigate('noticias');
  };

  if (authLoading) return <div>Carregando...</div>;
  if (!isAuthenticated) return <><LoginScreen /><RegisterModal /><ForgotPasswordModal /></>;

  return (
    <AppLayout
        resumo={resumo}
        favoritosCount={favoritos.length}
        totalOperacoes={operacoes.length}
        onOpenNovaOperacao={() => handleOpenNovaOperacao()}
        onOpenNovoProvento={() => handleOpenNovoProvento()}
        onOpenLancamentos={() => setModalLancamentosOpen(true)}
    >
        {loading && !resumo ? (
          <div>Carregando...</div>
        ) : (
          <>
            {currentRoute === 'dashboard' && <DashboardPage resumo={resumo} posicoes={posicoes} onNavigateTab={navigate} onOpenNovaOperacao={handleOpenNovaOperacao} />}
            {currentRoute === 'carteira' && <CarteiraTab posicoes={posicoes} onOpenNovaOperacao={handleOpenNovaOperacao} onOpenNovoProvento={handleOpenNovoProvento} onOpenLancamentos={() => setModalLancamentosOpen(true)} onSelectTicker={(ticker) => { const at = ativos.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase()); if (at) handleSelectAtivo(at); }} onAtualizarPrecos={handleAtualizarPrecos} carregandoPrecos={carregandoPrecos} />}
            {currentRoute === 'performance' && <PerformanceTab ativos={ativos} favoritos={favoritos} onToggleFavorito={handleToggleFavorito} onSelectAtivo={handleSelectAtivo} onCadastrarAtivo={handleOpenCadastrarAtivo} onSalvarAtivoRapido={handleCadastrarAtivo} onAtualizarPrecos={handleAtualizarPrecos} carregandoPrecos={carregandoPrecos} />}
            {currentRoute === 'noticias' && <NoticiasFavoritosTab key={noticiasTickerFiltro || 'noticias-geral'} ativos={ativos} favoritos={favoritos} initialTickerFiltro={noticiasTickerFiltro} onToggleFavorito={handleToggleFavorito} onSelectAtivo={handleSelectAtivo} />}
            {currentRoute === 'proventos' && <ProventosTab proventos={proventos} onOpenNovoProvento={handleOpenNovoProvento} onExcluirProvento={handleExcluirProvento} />}
            {currentRoute === 'admin' && <AdminPanelTab />}
          </>
        )}
      
      {/* Modais */}
      <AtivoDetalhesModal isOpen={modalDetalhesOpen} onClose={() => setModalDetalhesOpen(false)} ativo={selectedAtivo} isFavorito={isFavorito(selectedAtivo?.ticker || '', favoritos)} onToggleFavorito={handleToggleFavorito} onOpenNovaOperacao={handleOpenNovaOperacao} onNavigateToNoticias={handleNavigateToNoticias} />
      <LancamentosModal isOpen={modalLancamentosOpen} onClose={() => setModalLancamentosOpen(false)} operacoes={operacoes} onOpenNovaOperacao={handleOpenNovaOperacao} onExcluirOperacao={handleExcluirOperacao} />
      <NovaOperacaoModal isOpen={modalOperacaoOpen} onClose={() => setModalOperacaoOpen(false)} ativos={ativos} defaultTicker={modalTicker} defaultTipo={modalTipoOperacao} onSubmit={handleCriarOperacao} />
      <NovoProventoModal isOpen={modalProventoOpen} onClose={() => setModalProventoOpen(false)} ativos={ativos} defaultTicker={modalTicker} onSubmit={handleCriarProvento} />
      <NovoAtivoModal isOpen={modalAtivoOpen} onClose={() => { setModalAtivoOpen(false); setModalAtivoDados(undefined); }} defaultTicker={modalAtivoDados?.ticker} defaultNome={modalAtivoDados?.nome} defaultTipo={modalAtivoDados?.tipo} defaultSetor={modalAtivoDados?.setor} defaultPreco={modalAtivoDados?.precoAtual} defaultDividendYield={modalAtivoDados?.dividendYield} onSubmit={handleCadastrarAtivo} />
      <LoginModal />
      <RegisterModal />
      <ForgotPasswordModal />
      <UserProfileModal />
      <SecuritySettingsModal />
    </AppLayout>
  );
};
