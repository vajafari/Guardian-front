import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="text-xl font-bold text-primary">Guardian</div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {user && (
          <span className="text-sm text-gray-600 dark:text-gray-300">{user.username}</span>
        )}
        <Button size="sm" onClick={logout}>
          {t('header.logout')}
        </Button>
      </div>
    </header>
  );
}
