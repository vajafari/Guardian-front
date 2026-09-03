import { useTranslation } from 'react-i18next';
import { HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import { LanguageSwitcher } from './LanguageSwitcher';

const HEADER_HEIGHT = 64;

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="header border-b border-gray-200 dark:border-gray-700">
      <div className="header-wrapper" style={{ height: HEADER_HEIGHT }}>
        <div className="header-action header-action-start">
          <span className="text-xl font-bold text-primary">Guardian</span>
        </div>
        <div className="header-action header-action-end">
          <LanguageSwitcher />
          {user && (
            <span className="text-sm text-gray-600 dark:text-gray-300">{user.username}</span>
          )}
          <Button size="sm" icon={<HiOutlineLogout />} onClick={logout}>
            {t('header.logout')}
          </Button>
        </div>
      </div>
    </header>
  );
}
