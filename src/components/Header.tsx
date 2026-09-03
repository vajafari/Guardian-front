import { useAuth } from '../context/AuthContext';
import './Header.css';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__brand">Guardian</div>
      <div className="app-header__actions">
        {user && <span className="app-header__user">{user.username}</span>}
        <button type="button" className="app-header__logout" onClick={logout}>
          خروج
        </button>
      </div>
    </header>
  );
}
