import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelBuildingDepositMovement } from '../api/buildingDepositMovementService';
import { BuildingDepositMovementError, type BuildingDepositMovementErrorCode } from '../types/buildingDepositMovement';
import { Alert, Button, Dialog, FormItem, Input } from './ui';

interface BuildingDepositMovementCancelDialogProps {
  isOpen: boolean;
  movementId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function BuildingDepositMovementCancelDialog({ isOpen, movementId, onClose, onCancelled }: BuildingDepositMovementCancelDialogProps) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [reversalDate, setReversalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingDepositMovementErrorCode | null>(null);

  const handleConfirm = async () => {
    if (!movementId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelBuildingDepositMovement(movementId, cancelReason, reversalDate || null);
      setCancelReason('');
      setReversalDate('');
      onCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingDepositMovementError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={420}>
      <h4 className="mb-4">{t('buildingDeposits.movements.cancel.title')}</h4>

      {error && (
        <Alert type="danger" className="mb-3">
          {t(`buildingDeposits.movements.errors.${error}`)}
        </Alert>
      )}

      <FormItem label={t('buildingDeposits.movements.cancel.reason')} htmlFor="buildingDepositMovementCancelReason">
        <Input id="buildingDepositMovementCancelReason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} required />
      </FormItem>
      <FormItem label={t('buildingDeposits.movements.cancel.reversalDate')} htmlFor="buildingDepositMovementReversalDate">
        <Input
          id="buildingDepositMovementReversalDate"
          type="date"
          value={reversalDate}
          onChange={(event) => setReversalDate(event.target.value)}
        />
      </FormItem>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isSubmitting}>
          {t('buildingDeposits.movements.cancel.confirm')}
        </Button>
      </div>
    </Dialog>
  );
}
