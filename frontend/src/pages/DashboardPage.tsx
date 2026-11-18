import React from 'react';
import { useRouter } from '../context/router/RouterContext';
import { DashboardTab } from '../components/DashboardTab';

export const DashboardPage: React.FC<any> = (props) => {
  return <DashboardTab {...props} />;
};
