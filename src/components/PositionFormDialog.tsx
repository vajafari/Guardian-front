import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getFirstUnusedPositionNumber, savePosition } from '../api/positionAdminService';
import { PositionError, type Position, type PositionErrorCode } from '../types/position';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface PositionFormDialogProps {
  isOpen: boolean;
  position: Position | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PositionFormDialog({ isOpen, position, onClose, onSaved }: PositionFormDialogProps) {
  const { t } = useTranslation();
  const [positionNumber, setPositionNumber] = useState('');
  const [title, setTitle] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<PositionErrorCode | null>(null);

  const isEdit = position !== null;

  const reset = () => {
    setPositionNumber(position ? String(position.positionNumber) : '');
    setTitle(position?.title ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      if (!position) {
        getFirstUnusedPositionNumber()
          .then((n) => setPositionNumber(String(n)))
          .catch(() => {
            // Non-critical — the field stays empty and editable if this fails.
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, position]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: position?.id ?? crypto.randomUUID(),
      positionNumber: Number(positionNumber),
      title,
    };

    try {
      await savePosition(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof PositionError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={480}>
      <h4 className="mb-4">{isEdit ? t('positions.editTitle') : t('positions.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`positions.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('positions.fields.positionNumber')} htmlFor="positionNumber">
            <Input
              id="positionNumber"
              type="number"
              value={positionNumber}
              onChange={(event) => setPositionNumber(event.target.value)}
              required
            />
          </FormItem>

          <FormItem label={t('positions.fields.title')} htmlFor="positionTitle">
            <Input id="positionTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('positions.saving') : t('positions.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
