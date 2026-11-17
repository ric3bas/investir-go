import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { CarteiraTab } from './components/CarteiraTab';
import { OperacoesTab } from './components/OperacoesTab';
import { ProventosTab } from './components/ProventosTab';
import { MercadoTab } from './components/MercadoTab';
import { PerformanceTab } from './components/PerformanceTab';
import { NoticiasFavoritosTab } from './components/NoticiasFavoritosTab';
import { AtivoDetalhesModal } from './components/AtivoDetalhesModal';
import { NovaOperacaoModal } from './components/NovaOperacaoModal';
import { NovoProventoModal } from './components/NovoProventoModal';
import { NovoAtivoModal } from './components/NovoAtivoModal';
import { InvestirApi } from './services/api';
import { Ativo, Operacao, Provento, PosicaoCarteira, ResumoCarteira } from './types';
import { getFavoritos, toggleFavorito, isFavorito } from './utils/marketData';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resumo, setResumo] = useState<ResumoCarteira | null>(null);
  const [posicoes, setPosicoes] = useState<PosicaoCarteira[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modais de Transação & Cadastro
  const [modalOperacaoOpen, setModalOperacaoOpen] = useState(false);
  const [modalProventoOpen, setModalProventoOpen] = useState(false);
  const [modalAtivoOpen, setModalAtivoOpen] = useState(false);
  const [modalTicker, setModalTicker] = useState<string | undefined>();
  const [modalTipoOperacao, setModalTipoOperacao] = useState<'COMPRA' | 'VENDA'>('COMPRA');

  // Modal de Detalhes do Ativo (Até 5 Anos com Gráfico)
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);

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
    carregarDados();
  }, []);

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
    setModalTicker(defaultTicker);
    setModalTipoOperacao(defaultTipo);
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

  const handleNavigateToNoticias = (ticker?: string) => {
    setActiveTab('noticias');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resumo={resumo}
        favoritosCount={favoritos.length}
        onOpenNovaOperacao={handleOpenNovaOperacao}
        onOpenNovoProvento={handleOpenNovoProvento}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between">
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

            {/* 3. Top 7 Altas & Baixas (1D, 7D, 15D) - NOVO! */}
            {activeTab === 'performance' && (
              <PerformanceTab
                ativos={ativos}
                favoritos={favoritos}
                onToggleFavorito={handleToggleFavorito}
                onSelectAtivo={handleSelectAtivo}
              />
            )}

            {/* 4. Top 30 Ativos B3 & FIIs (com modal até 5 anos) */}
            {activeTab === 'mercado' && (
              <MercadoTab
                ativos={ativos}
                favoritos={favoritos}
                onToggleFavorito={handleToggleFavorito}
                onSelectAtivo={handleSelectAtivo}
                onOpenNovaOperacao={handleOpenNovaOperacao}
                onAtualizarCotacao={handleAtualizarCotacao}
                onCadastrarAtivo={() => setModalAtivoOpen(true)}
              />
            )}

            {/* 5. Notícias Recentes & Acompanhamento dos Favoritos - NOVO! */}
            {activeTab === 'noticias' && (
              <NoticiasFavoritosTab
                ativos={ativos}
                favoritos={favoritos}
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

            {/* 7. Lançamentos (Compras & Vendas) */}
            {activeTab === 'operacoes' && (
              <OperacoesTab
                operacoes={operacoes}
                onOpenNovaOperacao={handleOpenNovaOperacao}
                onExcluirOperacao={handleExcluirOperacao}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>InvestirGo • Plataforma de Gestão de Investimentos, Preço Médio, Proventos e Cotações (B3 & FIIs)</p>
      </footer>

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
        onClose={() => setModalAtivoOpen(false)}
        onSubmit={handleCadastrarAtivo}
      />
    </div>
  );
};

export default App;
