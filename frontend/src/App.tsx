import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { CarteiraTab } from './components/CarteiraTab';
import { OperacoesTab } from './components/OperacoesTab';
import { ProventosTab } from './components/ProventosTab';
import { MercadoTab } from './components/MercadoTab';
import { NovaOperacaoModal } from './components/NovaOperacaoModal';
import { NovoProventoModal } from './components/NovoProventoModal';
import { NovoAtivoModal } from './components/NovoAtivoModal';
import { InvestirApi } from './services/api';
import { Ativo, Operacao, Provento, PosicaoCarteira, ResumoCarteira } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resumo, setResumo] = useState<ResumoCarteira | null>(null);
  const [posicoes, setPosicoes] = useState<PosicaoCarteira[]>([]);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [proventos, setProventos] = useState<Provento[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modais
  const [modalOperacaoOpen, setModalOperacaoOpen] = useState(false);
  const [modalProventoOpen, setModalProventoOpen] = useState(false);
  const [modalAtivoOpen, setModalAtivoOpen] = useState(false);
  const [modalTicker, setModalTicker] = useState<string | undefined>();
  const [modalTipoOperacao, setModalTipoOperacao] = useState<'COMPRA' | 'VENDA'>('COMPRA');

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
      setError('Não foi possível conectar ao backend ou carregar os dados. Verifique se o backend está ativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resumo={resumo}
        onOpenNovaOperacao={handleOpenNovaOperacao}
        onOpenNovoProvento={handleOpenNovoProvento}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={carregarDados}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        {loading && !resumo ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm">Carregando dados da carteira...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab
                resumo={resumo}
                posicoes={posicoes}
                onNavigateTab={setActiveTab}
                onOpenNovaOperacao={handleOpenNovaOperacao}
              />
            )}

            {activeTab === 'carteira' && (
              <CarteiraTab
                posicoes={posicoes}
                onOpenNovaOperacao={handleOpenNovaOperacao}
                onOpenNovoProvento={handleOpenNovoProvento}
              />
            )}

            {activeTab === 'operacoes' && (
              <OperacoesTab
                operacoes={operacoes}
                onOpenNovaOperacao={handleOpenNovaOperacao}
                onExcluirOperacao={handleExcluirOperacao}
              />
            )}

            {activeTab === 'proventos' && (
              <ProventosTab
                proventos={proventos}
                onOpenNovoProvento={handleOpenNovoProvento}
                onExcluirProvento={handleExcluirProvento}
              />
            )}

            {activeTab === 'mercado' && (
              <MercadoTab
                ativos={ativos}
                onOpenNovaOperacao={handleOpenNovaOperacao}
                onAtualizarCotacao={handleAtualizarCotacao}
                onCadastrarAtivo={() => setModalAtivoOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>InvestirGo • Plataforma de Gestão de Investimentos, Preço Médio e Proventos (B3 & FIIs)</p>
      </footer>

      {/* Modais */}
      <NovaOperacaoModal
        isOpen={modalOperacaoOpen}
        onClose={() => setModalOperacaoOpen(false)}
        ativos={ativos}
        defaultTicker={modalTicker}
        defaultTipo={modalTipoOperacao}
        onSubmit={handleCriarOperacao}
      />

      <NovoProventoModal
        isOpen={modalProventoOpen}
        onClose={() => setModalProventoOpen(false)}
        ativos={ativos}
        defaultTicker={modalTicker}
        onSubmit={handleCriarProvento}
      />

      <NovoAtivoModal
        isOpen={modalAtivoOpen}
        onClose={() => setModalAtivoOpen(false)}
        onSubmit={handleCadastrarAtivo}
      />
    </div>
  );
};
export default App;
