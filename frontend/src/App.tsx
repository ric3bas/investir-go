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

import React, { useState, useEffect } from 'react';
import { RouterProvider } from './context/router/RouterContext';
import { AppWrapper } from './AppWrapper';

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <AppWrapper />
    </RouterProvider>
  );
};

export default App;
