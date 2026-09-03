import { useTranslation } from 'react-i18next';
import { HiOutlineChevronDown, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { Dropdown } from './ui';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <Dropdown
      placement="bottom-end"
      renderTitle={
        <div className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 header-action-item-hoverable">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {user?.entityTitle}
          </span>
          <HiOutlineChevronDown className="text-gray-500 dark:text-gray-400" />
        </div>
      }
    >
      <Dropdown.Item variant="header">
        <div className="flex items-center justify-between gap-4 px-1 py-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </Dropdown.Item>
      <Dropdown.Item variant="divider" />
      <Dropdown.Item eventKey="logout" className="gap-2" onClick={logout}>
        <HiOutlineLogout className="text-lg" />
        <span>{t('header.logout')}</span>
      </Dropdown.Item>
    </Dropdown>
  );
}
