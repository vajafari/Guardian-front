import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveFieldOfStudy } from '../api/fieldOfStudyAdminService';
import { FieldOfStudyError, type FieldOfStudy, type FieldOfStudyErrorCode } from '../types/fieldOfStudy';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface FieldOfStudyFormDialogProps {
  isOpen: boolean;
  fieldOfStudy: FieldOfStudy | null;
  onClose: () => void;
  onSaved: () => void;
}

export function FieldOfStudyFormDialog({ isOpen, fieldOfStudy, onClose, onSaved }: FieldOfStudyFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FieldOfStudyErrorCode | null>(null);

  const isEdit = fieldOfStudy !== null;

  const reset = () => {
    setTitle(fieldOfStudy?.title ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fieldOfStudy]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: fieldOfStudy?.id ?? crypto.randomUUID(),
      title,
    };

    try {
      await saveFieldOfStudy(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof FieldOfStudyError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={480}>
      <h4 className="mb-4">{isEdit ? t('fieldOfStudies.editTitle') : t('fieldOfStudies.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`fieldOfStudies.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('fieldOfStudies.fields.title')} htmlFor="fieldOfStudyTitle">
            <Input id="fieldOfStudyTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('fieldOfStudies.saving') : t('fieldOfStudies.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
