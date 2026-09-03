import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
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
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
