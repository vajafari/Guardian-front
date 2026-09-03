import { useTranslation } from 'react-i18next';
import './SideMenu.css';

const MENU_KEYS = ['dashboard', 'users', 'reports', 'settings'] as const;

export function SideMenu() {
  const { t } = useTranslation();

  return (
    <nav className="side-menu" aria-label="Main">
      <ul className="side-menu__list">
        {MENU_KEYS.map((key) => (
          <li key={key}>
            <a className="side-menu__link" href="#">
              {t(`menu.${key}`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
