import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import './LoginPage.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>

        <label className="login-label" htmlFor="username">
          {t('login.username')}
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
          {t('login.password')}
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

        {error && <p className="login-error">{t(`errors.${error}`)}</p>}

        <button className="login-submit" type="submit" disabled={isLoading}>
          {isLoading ? t('login.submitting') : t('login.submit')}
        </button>

        <div className="login-language">
          <LanguageSwitcher />
        </div>
      </form>
    </div>
  );
}
