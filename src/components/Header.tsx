import { UserMenu } from './UserMenu';

const HEADER_HEIGHT = 64;

export function Header() {
  return (
    <header className="header border-b border-gray-200 dark:border-gray-700">
      <div className="header-wrapper" style={{ height: HEADER_HEIGHT }}>
        <div className="header-action header-action-start">
          <span className="text-xl font-bold text-primary">Guardian</span>
        </div>
        <div className="header-action header-action-end">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
