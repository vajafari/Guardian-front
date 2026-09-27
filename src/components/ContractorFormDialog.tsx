import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addContractor, updateContractor } from '../api/contractorService';
import { ContractorError, type Contractor, type ContractorErrorCode, type ContractorPayload } from '../types/contractor';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface ContractorFormDialogProps {
  isOpen: boolean;
  contractor: Contractor | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ContractorFormDialog({ isOpen, contractor, onClose, onSaved }: ContractorFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [subjectOfActivity, setSubjectOfActivity] = useState('');
  const [economicCode, setEconomicCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ContractorErrorCode | null>(null);

  const isEdit = contractor !== null;

  const reset = () => {
    setTitle(contractor?.title ?? '');
    setPhoneNumber(contractor?.phoneNumber ?? '');
    setAddress(contractor?.address ?? '');
    setSubjectOfActivity(contractor?.subjectOfActivity ?? '');
    setEconomicCode(contractor?.economicCode ?? '');
    setStartDate(contractor?.startDate?.slice(0, 10) ?? '');
    setEndDate(contractor?.endDate?.slice(0, 10) ?? '');
    setDescription(contractor?.description ?? '');
    setIsActive(contractor?.isActive ?? true);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contractor]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: ContractorPayload = {
      id: contractor?.id ?? crypto.randomUUID(),
      title,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
      contactorType: 1,
      subjectOfActivity: subjectOfActivity || null,
      phoneNumber: phoneNumber || null,
      address: address || null,
      description: description || null,
      economicCode: economicCode || null,
      contracts: [],
    };

    try {
      if (isEdit) {
        await updateContractor(payload);
      } else {
        await addContractor(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ContractorError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={640}>
      <h4 className="mb-4">{isEdit ? t('contractors.editTitle') : t('contractors.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`contractors.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('contractors.fields.title')} htmlFor="contractorTitle">
              <Input id="contractorTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('contractors.fields.phoneNumber')} htmlFor="contractorPhone">
              <Input id="contractorPhone" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            </FormItem>
            <FormItem label={t('contractors.fields.economicCode')} htmlFor="contractorEconomicCode">
              <Input
                id="contractorEconomicCode"
                value={economicCode}
                onChange={(event) => setEconomicCode(event.target.value)}
              />
            </FormItem>

            <FormItem label={t('contractors.fields.subjectOfActivity')} htmlFor="contractorSubject">
              <Input
                id="contractorSubject"
                value={subjectOfActivity}
                onChange={(event) => setSubjectOfActivity(event.target.value)}
              />
            </FormItem>
            <FormItem label={t('contractors.fields.startDate')} htmlFor="contractorStartDate">
              <Input id="contractorStartDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </FormItem>
            <FormItem label={t('contractors.fields.endDate')} htmlFor="contractorEndDate">
              <Input id="contractorEndDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </FormItem>
          </div>

          <FormItem label={t('contractors.fields.address')} htmlFor="contractorAddress">
            <Input id="contractorAddress" textArea rows={2} value={address} onChange={(event) => setAddress(event.target.value)} />
          </FormItem>
          <FormItem label={t('contractors.fields.description')} htmlFor="contractorDescription">
            <Input
              id="contractorDescription"
              textArea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormItem>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="accent-primary"
            />
            {t('contractors.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('contractors.saving') : t('contractors.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
