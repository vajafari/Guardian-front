import './SideMenu.css';

interface MenuItem {
  label: string;
  href: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'داشبورد', href: '#' },
  { label: 'کاربران', href: '#' },
  { label: 'گزارش‌ها', href: '#' },
  { label: 'تنظیمات', href: '#' },
];

export function SideMenu() {
  return (
    <nav className="side-menu" aria-label="منوی اصلی">
      <ul className="side-menu__list">
        {MENU_ITEMS.map((item) => (
          <li key={item.label}>
            <a className="side-menu__link" href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
