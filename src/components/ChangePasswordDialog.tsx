import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineRefresh } from 'react-icons/hi';
import { changePassword, getCaptchaImage } from '../api/accountService';
import { ChangePasswordError, type ChangePasswordErrorCode } from '../types/account';
import { Alert, Button, Dialog, FormContainer, FormItem, Input, Spinner } from './ui';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ isOpen, onClose }: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityImage, setSecurityImage] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChangePasswordErrorCode | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const captchaUrlRef = useRef<string | null>(null);

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
      captchaUrlRef.current = null;
      setCaptchaUrl(null);
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetAndClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityImage('');
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('passwords-do-not-match');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ oldPassword, newPassword, securityImage });
      setIsSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityImage('');
    } catch (err) {
      setError(err instanceof ChangePasswordError ? err.code : 'unknown');
      setSecurityImage('');
      loadCaptcha(); // captcha is single-use — get a fresh one for the next attempt
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={resetAndClose} onRequestClose={resetAndClose} width={420}>
      <h4 className="mb-4">{t('account.changePasswordTitle')}</h4>

      {isSuccess ? (
        <>
          <Alert type="success" className="mb-4">
            {t('account.success')}
          </Alert>
          <Button block onClick={resetAndClose}>
            {t('account.close')}
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormContainer>
            {error && (
              <Alert type="danger" className="mb-4">
                {t(`errors.${error}`)}
              </Alert>
            )}

            <FormItem label={t('account.oldPassword')} htmlFor="oldPassword">
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </FormItem>

            <FormItem label={t('account.newPassword')} htmlFor="newPassword">
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </FormItem>

            <FormItem label={t('account.confirmPassword')} htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </FormItem>

            <FormItem label={t('account.captcha')} htmlFor="securityImage">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-11 w-32 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {isCaptchaLoading ? (
                    <Spinner />
                  ) : captchaUrl ? (
                    <img src={captchaUrl} alt={t('account.captcha')} className="h-full w-full object-contain" />
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
                id="securityImage"
                type="text"
                value={securityImage}
                onChange={(event) => setSecurityImage(event.target.value)}
                autoComplete="off"
                required
              />
            </FormItem>

            <Button variant="solid" block type="submit" loading={isSubmitting}>
              {isSubmitting ? t('account.submitting') : t('account.submit')}
            </Button>
          </FormContainer>
        </form>
      )}
    </Dialog>
  );
}
