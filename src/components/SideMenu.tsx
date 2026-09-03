import { useTranslation } from 'react-i18next';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineDocumentReport,
  HiOutlineCog,
} from 'react-icons/hi';
import { Menu, MenuItem } from './ui';

const MENU_ITEMS = [
  { key: 'dashboard', icon: HiOutlineViewGrid },
  { key: 'users', icon: HiOutlineUsers },
  { key: 'reports', icon: HiOutlineDocumentReport },
  { key: 'settings', icon: HiOutlineCog },
] as const;

const SIDE_NAV_WIDTH = 290;

export function SideMenu() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700"
      style={{ width: SIDE_NAV_WIDTH, minWidth: SIDE_NAV_WIDTH }}
    >
      <div className="p-3">
        <Menu defaultActiveKeys={['dashboard']}>
          <Menu.MenuGroup label={t('menu.groupTitle')}>
            {MENU_ITEMS.map(({ key, icon: Icon }) => (
              <MenuItem key={key} eventKey={key}>
                <Icon className="text-xl" />
                <span>{t(`menu.${key}`)}</span>
              </MenuItem>
            ))}
          </Menu.MenuGroup>
        </Menu>
      </div>
    </div>
  );
}
