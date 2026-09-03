import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch {
      // error is already surfaced via auth context state
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">Guardian</h1>
        <p className="login-subtitle">ورود به پنل مدیریت</p>

        <label className="login-label" htmlFor="username">
          نام کاربری
        </label>
        <input
          id="username"
          className="login-input"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label className="login-label" htmlFor="password">
          رمز عبور
        </label>
        <input
          id="password"
          className="login-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button className="login-submit" type="submit" disabled={isLoading}>
          {isLoading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
