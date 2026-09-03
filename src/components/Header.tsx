import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import './Header.css';

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div className="app-header__brand">Guardian</div>
      <div className="app-header__actions">
        <LanguageSwitcher />
        {user && <span className="app-header__user">{user.username}</span>}
        <button type="button" className="app-header__logout" onClick={logout}>
          {t('header.logout')}
        </button>
      </div>
    </header>
  );
}
