import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonsPage } from './pages/PersonsPage';
import { BuildingsPage } from './pages/BuildingsPage';
import { BuildingDetailPage } from './pages/BuildingDetailPage';
import { FloorDetailPage } from './pages/FloorDetailPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { EditPersonPage } from './pages/EditPersonPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { ContractorDetailPage } from './pages/ContractorDetailPage';
import { DashboardLayout } from './components/DashboardLayout';
import { useSyncDocumentDirection } from './hooks/useSyncDocumentDirection';
import { ConfigProvider } from './components/ui';
import { useTheme } from './context/ThemeContext';

function App() {
  useSyncDocumentDirection();
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const language = i18n.resolvedLanguage ?? 'en';

  return (
    <ConfigProvider
      value={{
        mode: theme,
        locale: language,
        controlSize: 'md',
        direction: i18n.dir(language),
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/persons" element={<PersonsPage />} />
              <Route path="/buildings" element={<BuildingsPage />} />
              <Route path="/buildings/:id" element={<BuildingDetailPage />} />
              <Route path="/floors/:id" element={<FloorDetailPage />} />
              <Route path="/persons/:id" element={<PersonDetailPage />} />
              <Route path="/persons/:id/edit" element={<EditPersonPage />} />
              <Route path="/contractors" element={<ContractorsPage />} />
              <Route path="/contractors/:id" element={<ContractorDetailPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
