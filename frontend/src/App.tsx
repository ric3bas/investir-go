import React from 'react';
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
