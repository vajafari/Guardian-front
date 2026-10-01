import { useTranslation } from 'react-i18next';
import { Alert, Button, Dialog } from './ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{title ?? t('common.confirmTitle')}</h4>

      <Alert type="warning" className="mb-5">
        {message}
      </Alert>

      <div className="flex justify-end gap-2">
        <Button onClick={onClose} disabled={isConfirming}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={onConfirm} loading={isConfirming}>
          {confirmText ?? t('common.delete')}
        </Button>
      </div>
    </Dialog>
  );
}
