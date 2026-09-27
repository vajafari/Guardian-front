import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlineDocumentReport,
  HiOutlineCog,
} from 'react-icons/hi';
import { Menu, MenuItem } from './ui';

const MENU_ITEMS = [
  { key: 'dashboard', icon: HiOutlineViewGrid, path: '/dashboard' },
  { key: 'persons', icon: HiOutlineUsers, path: '/persons' },
  { key: 'buildings', icon: HiOutlineOfficeBuilding, path: '/buildings' },
  { key: 'contractors', icon: HiOutlineBriefcase, path: '/contractors' },
  { key: 'reports', icon: HiOutlineDocumentReport, path: null },
  { key: 'settings', icon: HiOutlineCog, path: null },
] as const;

const SIDE_NAV_WIDTH = 200;

export function SideMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = MENU_ITEMS.find((item) => item.path === location.pathname)?.key ?? 'dashboard';

  const handleSelect = (key: string) => {
    const item = MENU_ITEMS.find((menuItem) => menuItem.key === key);
    if (item?.path) {
      navigate(item.path);
    }
  };

  return (
    <div
      className="flex flex-col flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700"
      style={{ width: SIDE_NAV_WIDTH, minWidth: SIDE_NAV_WIDTH }}
    >
      <div className="p-3">
        <Menu>
          <Menu.MenuGroup label={t('menu.groupTitle')}>
            {MENU_ITEMS.map(({ key, icon: Icon }) => (
              <MenuItem key={key} eventKey={key} isActive={key === activeKey} onSelect={handleSelect}>
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
