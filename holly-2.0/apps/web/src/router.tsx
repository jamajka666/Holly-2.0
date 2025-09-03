import { createBrowserRouter } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import AlertsPage from './pages/Alerts';
import VaultPage from './pages/Vault';
import SettingsPage from './pages/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/alerts',
    element: <AlertsPage />,
  },
  {
    path: '/vault',
    element: <VaultPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
]);

export default router;