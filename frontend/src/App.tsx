import React, { useState, useEffect } from 'react';
import { Sidebar, TopHeader } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { CarteiraTab } from './components/CarteiraTab';
import { ProventosTab } from './components/ProventosTab';
import { PerformanceTab } from './components/PerformanceTab';
import { NoticiasFavoritosTab } from './components/NoticiasFavoritosTab';
import { AtivoDetalhesModal } from './components/AtivoDetalhesModal';
import { NovaOperacaoModal } from './components/NovaOperacaoModal';
import { NovoProventoModal } from './components/NovoProventoModal';
import { NovoAtivoModal } from './components/NovoAtivoModal';
import { LancamentosModal } from './components/LancamentosModal';
import { LoginModal } from './components/auth/LoginModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { SecuritySettingsModal } from './components/auth/SecuritySettingsModal';
import { AdminPanelTab } from './components/auth/AdminPanelTab';
import { useAuth } from './context/AuthContext';
import { InvestirApi } from './services/api';
import { Ativo, Operacao, Provento, PosicaoCarteira, ResumoCarteira } from './types';
import { getFavoritos, toggleFavorito, isFavorito, TOP_30_ATIVOS } from './utils/marketData';
import { AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resumo, setResumo] = useState<ResumoCarteira | null>(null);
  const [posicoes, setPosicoes] = useState<PosicaoCarteira[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>(TOP_30_ATIVOS);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modais de Transação & Cadastro
  const [modalOperacaoOpen, setModalOperacaoOpen] = useState(false);
  const [modalProventoOpen, setModalProventoOpen] = useState(false);
  const [modalLancamentosOpen, setModalLancamentosOpen] = useState(false);
  const [modalAtivoOpen, setModalAtivoOpen] = useState(false);
  const [modalAtivoDados, setModalAtivoDados] = useState<{
    ticker?: string;
    nome?: string;
    tipo?: 'Acao' | 'FII' | 'BDR' | 'ETF';
    setor?: string;
    precoAtual?: number;
    dividendYield?: number;
  } | undefined>();
  const [modalTicker, setModalTicker] = useState<string | undefined>();
  const [modalTipoOperacao, setModalTipoOperacao] = useState<'COMPRA' | 'VENDA'>('COMPRA');

  // Modal de Detalhes do Ativo (Até 5 Anos com Gráfico)
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);
  const [noticiasTickerFiltro, setNoticiasTickerFiltro] = useState<string | undefined>();

  // Inicializar Favoritos do localStorage
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
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      // O InvestirApi já implementa fallback resiliente, mas caso haja erro imprevisto
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

  // Handlers de Favorito
  const handleToggleFavorito = (ticker: string) => {
    const novos = toggleFavorito(ticker);
    setFavoritos([...novos]);
  };

  // Handler de Abertura do Modal de Detalhes (5 Anos com Gráfico)
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

  const handleAtualizarCotacao = async (id: number, novoPreco: number) => {
    await InvestirApi.atualizarCotacao(id, novoPreco);
    await carregarDados();
  };

  const handleCadastrarAtivo = async (data: any) => {
    await InvestirApi.criarAtivo(data);
    await carregarDados();
  };

  const handleOpenCadastrarAtivo = (dados?: {
    ticker?: string;
    nome?: string;
    tipo?: 'Acao' | 'FII' | 'BDR' | 'ETF';
    setor?: string;
    precoAtual?: number;
    dividendYield?: number;
  }) => {
    setModalAtivoDados(dados);
    setModalAtivoOpen(true);
  };

  const handleNavigateToNoticias = (ticker?: string) => {
    setNoticiasTickerFiltro(ticker);
    setActiveTab('noticias');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'noticias') {
      setNoticiasTickerFiltro(undefined);
    }
    setActiveTab(tab);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
          <TrendingUp className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Verificando sessão segura...</p>
      </div>
    );
  }

  // Se o usuário não estiver autenticado, exibe a tela de login dedicada e oculta todo o patrimônio e dados
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <RegisterModal />
        <ForgotPasswordModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Sidebar Lateral Fixa (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        resumo={resumo}
        favoritosCount={favoritos.length}
        totalOperacoes={operacoes.length}
        onOpenNovaOperacao={handleOpenNovaOperacao}
        onOpenNovoProvento={handleOpenNovoProvento}
        onOpenLancamentos={() => setModalLancamentosOpen(true)}
      />

      {/* Viewport Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          resumo={resumo}
          favoritosCount={favoritos.length}
          totalOperacoes={operacoes.length}
          onOpenNovaOperacao={handleOpenNovaOperacao}
          onOpenNovoProvento={handleOpenNovoProvento}
          onOpenLancamentos={() => setModalLancamentosOpen(true)}
        />

        {/* Conteúdo Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={carregarDados}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recarregar</span>
            </button>
          </div>
        )}

        {loading && !resumo ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm font-medium">Carregando dados da carteira e cotações...</p>
          </div>
        ) : (
          <>
            {/* 1. Dashboard Consolidado */}
            {activeTab === 'dashboard' && (
              <DashboardTab
                resumo={resumo}
                posicoes={posicoes}
                onNavigateTab={setActiveTab}
                onOpenNovaOperacao={handleOpenNovaOperacao}
              />
            )}

            {/* 2. Minha Carteira & Preço Médio */}
            {activeTab === 'carteira' && (
              <CarteiraTab
                posicoes={posicoes}
                onOpenNovaOperacao={handleOpenNovaOperacao}
                onOpenNovoProvento={handleOpenNovoProvento}
                onSelectTicker={(ticker) => {
                  const at = ativos.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase());
                  if (at) handleSelectAtivo(at);
                }}
              />
            )}

            {/* 3. Top 7 Altas & Baixas (1D, 7D, 15D) com Busca & Inclusão de Ativos */}
            {activeTab === 'performance' && (
              <PerformanceTab
                ativos={ativos}
                favoritos={favoritos}
                onToggleFavorito={handleToggleFavorito}
                onSelectAtivo={handleSelectAtivo}
                onCadastrarAtivo={handleOpenCadastrarAtivo}
                onSalvarAtivoRapido={handleCadastrarAtivo}
              />
            )}


            {/* 5. Notícias Recentes & Acompanhamento dos Favoritos */}
            {activeTab === 'noticias' && (
              <NoticiasFavoritosTab
                key={noticiasTickerFiltro || 'noticias-geral'}
                ativos={ativos}
                favoritos={favoritos}
                initialTickerFiltro={noticiasTickerFiltro}
                onToggleFavorito={handleToggleFavorito}
                onSelectAtivo={handleSelectAtivo}
              />
            )}

            {/* 6. Extrato e Evolução de Proventos */}
            {activeTab === 'proventos' && (
              <ProventosTab
                proventos={proventos}
                onOpenNovoProvento={handleOpenNovoProvento}
                onExcluirProvento={handleExcluirProvento}
              />
            )}

            {/* 7. Painel Administrativo de Segurança & Governança */}
            {activeTab === 'admin' && (
              <AdminPanelTab />
            )}
          </>
        )}
      </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] bg-[#070a12]/80 backdrop-blur py-5 text-center text-xs text-slate-500 font-mono">
          <p>InvestirGo • Plataforma Institucional de Gestão de Investimentos, Preço Médio e Proventos (B3 & FIIs)</p>
        </footer>
      </div>

      {/* Modal Interativo de Análise do Ativo (Até 5 Anos com Gráfico) */}
      <AtivoDetalhesModal
        isOpen={modalDetalhesOpen}
        onClose={() => setModalDetalhesOpen(false)}
        ativo={selectedAtivo}
        isFavorito={isFavorito(selectedAtivo?.ticker || '', favoritos)}
        onToggleFavorito={handleToggleFavorito}
        onOpenNovaOperacao={handleOpenNovaOperacao}
        onNavigateToNoticias={handleNavigateToNoticias}
      />

      {/* Modal de Extrato e Histórico de Lançamentos */}
      <LancamentosModal
        isOpen={modalLancamentosOpen}
        onClose={() => setModalLancamentosOpen(false)}
        operacoes={operacoes}
        onOpenNovaOperacao={handleOpenNovaOperacao}
        onExcluirOperacao={handleExcluirOperacao}
      />

      {/* Modal de Lançamento de Operações */}
      <NovaOperacaoModal
        isOpen={modalOperacaoOpen}
        onClose={() => setModalOperacaoOpen(false)}
        ativos={ativos}
        defaultTicker={modalTicker}
        defaultTipo={modalTipoOperacao}
        onSubmit={handleCriarOperacao}
      />

      {/* Modal de Lançamento de Proventos */}
      <NovoProventoModal
        isOpen={modalProventoOpen}
        onClose={() => setModalProventoOpen(false)}
        ativos={ativos}
        defaultTicker={modalTicker}
        onSubmit={handleCriarProvento}
      />

      {/* Modal de Cadastro de Novo Ativo */}
      <NovoAtivoModal
        isOpen={modalAtivoOpen}
        onClose={() => {
          setModalAtivoOpen(false);
          setModalAtivoDados(undefined);
        }}
        defaultTicker={modalAtivoDados?.ticker}
        defaultNome={modalAtivoDados?.nome}
        defaultTipo={modalAtivoDados?.tipo}
        defaultSetor={modalAtivoDados?.setor}
        defaultPreco={modalAtivoDados?.precoAtual}
        defaultDividendYield={modalAtivoDados?.dividendYield}
        onSubmit={handleCadastrarAtivo}
      />

      {/* Modais de Autenticação, Perfis, MFA e Recuperação de Senha */}
      <LoginModal />
      <RegisterModal />
      <ForgotPasswordModal />
      <UserProfileModal />
      <SecuritySettingsModal />
    </div>
  );
};

export default App;
