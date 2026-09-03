import { useTranslation } from 'react-i18next';
import { Menu, MenuItem } from './ui';

const MENU_KEYS = ['dashboard', 'users', 'reports', 'settings'] as const;

export function SideMenu() {
  const { t } = useTranslation();

  return (
    <aside className="w-56 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <Menu defaultActiveKeys={['dashboard']}>
        {MENU_KEYS.map((key) => (
          <MenuItem key={key} eventKey={key}>
            {t(`menu.${key}`)}
          </MenuItem>
        ))}
      </Menu>
    </aside>
  );
}
