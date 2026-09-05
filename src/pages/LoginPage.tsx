import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineRefresh } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { changePasswordOnForceChange, getCaptchaImage } from '../api/accountService';
import { AuthError } from '../types/auth';
import { ChangePasswordError, type ChangePasswordErrorCode } from '../types/account';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { Alert, Button, Card, FormContainer, FormItem, Input, Spinner } from '../components/ui';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [mode, setMode] = useState<'login' | 'force-change'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityImage, setSecurityImage] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changeError, setChangeError] = useState<ChangePasswordErrorCode | null>(null);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const captchaUrlRef = useRef<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const loadCaptcha = async () => {
    setIsCaptchaLoading(true);
    try {
      const blob = await getCaptchaImage();
      const nextUrl = URL.createObjectURL(blob);
      if (captchaUrlRef.current) {
        URL.revokeObjectURL(captchaUrlRef.current);
      }
      captchaUrlRef.current = nextUrl;
      setCaptchaUrl(nextUrl);
    } catch {
      // Pre-login, there's no bearer token yet — the backend currently
      // requires one for GET /api/Captcha/CaptchaImage, so this call is
      // expected to fail (401) until that's relaxed for this flow.
      captchaUrlRef.current = null;
      setCaptchaUrl(null);
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'force-change') {
      loadCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === 'password-expired') {
        setMode('force-change');
      }
      // other errors are already surfaced via auth context state
    }
  };

  const handleForceChangeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChangeError(null);

    if (newPassword !== confirmPassword) {
      setChangeError('passwords-do-not-match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordOnForceChange({ username, oldPassword: password, newPassword, securityImage });
      setChangeSuccess(true);
    } catch (err) {
      setChangeError(err instanceof ChangePasswordError ? err.code : 'unknown');
      setSecurityImage('');
      loadCaptcha();
    } finally {
      setIsChangingPassword(false);
    }
  };

  const backToSignIn = () => {
    setMode('login');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityImage('');
    setChangeError(null);
    setChangeSuccess(false);
  };

  return (
    <div className="relative min-h-svh flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="absolute top-4 end-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm" bodyClass="p-8">
        <h1 className="text-3xl font-bold text-center text-primary mb-1">{t('login.title')}</h1>

        {mode === 'login' ? (
          <>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{t('login.subtitle')}</p>

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
          </>
        ) : (
          <>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              {t('login.passwordExpiredNotice')}
            </p>

            {changeSuccess ? (
              <>
                <Alert type="success" className="mb-4">
                  {t('login.passwordChangedSignInAgain')}
                </Alert>
                <Button block onClick={backToSignIn}>
                  {t('login.backToSignIn')}
                </Button>
              </>
            ) : (
              <form onSubmit={handleForceChangeSubmit}>
                <FormContainer>
                  {changeError && (
                    <Alert type="danger" className="mb-4">
                      {t(`errors.${changeError}`)}
                    </Alert>
                  )}

                  <FormItem label={t('account.oldPassword')} htmlFor="forceOldPassword">
                    <Input
                      id="forceOldPassword"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </FormItem>

                  <FormItem label={t('account.newPassword')} htmlFor="forceNewPassword">
                    <Input
                      id="forceNewPassword"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </FormItem>

                  <FormItem label={t('account.confirmPassword')} htmlFor="forceConfirmPassword">
                    <Input
                      id="forceConfirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </FormItem>

                  <FormItem label={t('account.captcha')} htmlFor="forceSecurityImage">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center h-11 w-32 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        {isCaptchaLoading ? (
                          <Spinner />
                        ) : captchaUrl ? (
                          <img
                            src={captchaUrl}
                            alt={t('account.captcha')}
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={loadCaptcha}
                        aria-label={t('account.refreshCaptcha')}
                        className="header-action-item header-action-item-hoverable text-lg text-gray-600 dark:text-gray-300"
                      >
                        <HiOutlineRefresh />
                      </button>
                    </div>
                    <Input
                      id="forceSecurityImage"
                      type="text"
                      value={securityImage}
                      onChange={(event) => setSecurityImage(event.target.value)}
                      autoComplete="off"
                    />
                  </FormItem>

                  <Button variant="solid" block type="submit" loading={isChangingPassword}>
                    {isChangingPassword ? t('account.submitting') : t('account.submit')}
                  </Button>

                  <Button block className="mt-2" onClick={backToSignIn}>
                    {t('login.backToSignIn')}
                  </Button>
                </FormContainer>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
