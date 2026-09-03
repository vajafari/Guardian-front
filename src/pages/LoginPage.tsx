import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { Alert, Button, Card, FormContainer, FormItem, Input } from '../components/ui';

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
    <div className="relative min-h-svh flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="absolute top-4 end-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm" bodyClass="p-8">
        <h1 className="text-3xl font-bold text-center text-primary mb-1">
          {t('login.title')}
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          {t('login.subtitle')}
        </p>

        {error && (
          <Alert type="danger" className="mb-4">
            {t(`errors.${error}`)}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormContainer>
            <FormItem label={t('login.username')} htmlFor="username">
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </FormItem>

            <FormItem label={t('login.password')} htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </FormItem>

            <Button variant="solid" block type="submit" loading={isLoading}>
              {isLoading ? t('login.submitting') : t('login.submit')}
            </Button>

            <div className="flex justify-center mt-5">
              <LanguageSwitcher />
            </div>
          </FormContainer>
        </form>
      </Card>
    </div>
  );
}
