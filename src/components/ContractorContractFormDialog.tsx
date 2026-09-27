import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addContractorContract, updateContractorContract } from '../api/contractorContractService';
import {
  ContractorContractError,
  type ContractorContract,
  type ContractorContractErrorCode,
} from '../types/contractorContract';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface ContractorContractFormDialogProps {
  isOpen: boolean;
  contractorId: string;
  contract: ContractorContract | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ContractorContractFormDialog({
  isOpen,
  contractorId,
  contract,
  onClose,
  onSaved,
}: ContractorContractFormDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ContractorContractErrorCode | null>(null);

  const isEdit = contract !== null;

  const reset = () => {
    setTitle(contract?.title ?? '');
    setContractNumber(contract?.contractNumber ?? '');
    setStartDate(contract?.startDate?.slice(0, 10) ?? '');
    setEndDate(contract?.endDate?.slice(0, 10) ?? '');
    setDescription(contract?.description ?? '');
    setIsActive(contract?.isActive ?? true);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contract]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: contract?.id ?? crypto.randomUUID(),
      contractorId,
      title,
      contractNumber,
      startDate: startDate || null,
      endDate: endDate || null,
      description: description || null,
      isActive,
    };

    try {
      if (isEdit) {
        await updateContractorContract(payload);
      } else {
        await addContractorContract(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ContractorContractError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={480}>
      <h4 className="mb-4">{isEdit ? t('contractorContracts.editTitle') : t('contractorContracts.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`contractorContracts.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('contractorContracts.fields.title')} htmlFor="contractorContractTitle">
            <Input id="contractorContractTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>
          <FormItem label={t('contractorContracts.fields.contractNumber')} htmlFor="contractorContractNumber">
            <Input
              id="contractorContractNumber"
              value={contractNumber}
              onChange={(event) => setContractNumber(event.target.value)}
              required
            />
          </FormItem>
          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('contractorContracts.fields.startDate')} htmlFor="contractorContractStartDate">
              <Input
                id="contractorContractStartDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </FormItem>
            <FormItem label={t('contractorContracts.fields.endDate')} htmlFor="contractorContractEndDate">
              <Input
                id="contractorContractEndDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </FormItem>
          </div>
          <FormItem label={t('contractorContracts.fields.description')} htmlFor="contractorContractDescription">
            <Input
              id="contractorContractDescription"
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
            {t('contractorContracts.fields.isActive')}
          </label>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('contractorContracts.saving') : t('contractorContracts.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
