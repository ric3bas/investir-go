import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Route = 'dashboard' | 'carteira' | 'performance' | 'proventos' | 'noticias' | 'admin' | 'login';

interface RouterContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getRouteFromPath = (): Route => {
    const path = window.location.pathname.substring(1);
    const validRoutes: Route[] = ['dashboard', 'carteira', 'performance', 'proventos', 'noticias', 'admin', 'login'];
    return validRoutes.includes(path as Route) ? (path as Route) : 'dashboard';
  };

  const [currentRoute, setCurrentRoute] = useState<Route>(getRouteFromPath());

  useEffect(() => {
    const handlePopState = () => setCurrentRoute(getRouteFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: Route) => {
    window.history.pushState({}, '', `/${route === 'dashboard' ? '' : route}`);
    setCurrentRoute(route);
  };

  return (
    <RouterContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within RouterProvider');
  return context;
};
