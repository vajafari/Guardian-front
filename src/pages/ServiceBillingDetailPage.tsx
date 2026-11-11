import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getServiceBillingById } from '../api/serviceBillingService';
import type { ServiceBillingFullInfo } from '../types/serviceBilling';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ServiceBillingCancelDialog } from '../components/ServiceBillingCancelDialog';

export function ServiceBillingDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [serviceBilling, setServiceBilling] = useState<ServiceBillingFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getServiceBillingById(id);
      setServiceBilling(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const infoFields: Array<{ label: string; value: string }> = serviceBilling
    ? [
        { label: t('serviceBillings.fields.accountingEntity'), value: serviceBilling.accountingEntityTitle },
        { label: t('serviceBillings.fields.party'), value: serviceBilling.partyDisplayName },
        { label: t('serviceBillings.fields.serviceBillingType'), value: serviceBilling.serviceBillingTypeTitle },
        {
          label: t('serviceBillings.fields.buildingUnitOrSpace'),
          value: serviceBilling.buildingUnitTitle ?? serviceBilling.buildingSpaceTitle ?? '—',
        },
        { label: t('serviceBillings.fields.building'), value: serviceBilling.buildingTitle },
        { label: t('serviceBillings.fields.title'), value: serviceBilling.title },
        { label: t('serviceBillings.fields.amount'), value: serviceBilling.amount.toLocaleString() },
        { label: t('serviceBillings.fields.openAmount'), value: serviceBilling.openAmount.toLocaleString() },
        { label: t('serviceBillings.fields.documentDate'), value: serviceBilling.documentDate },
        { label: t('serviceBillings.fields.dueDate'), value: serviceBilling.dueDate },
        { label: t('serviceBillings.fields.fund'), value: serviceBilling.fundTitle },
        { label: t('serviceBillings.fields.costCategory'), value: serviceBilling.costCategoryTitle ?? '—' },
        { label: t('serviceBillings.fields.status'), value: t(`serviceBillings.statuses.${serviceBilling.status}`) },
        { label: t('serviceBillings.fields.description'), value: serviceBilling.description ?? '—' },
      ]
    : [];

  if (serviceBilling?.status === 3) {
    infoFields.push({ label: t('serviceBillings.fields.cancelReason'), value: serviceBilling.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/service-billings')}>
            {t('serviceBillings.detail.back')}
          </Button>
          <h1>{serviceBilling ? serviceBilling.documentNumber : t('serviceBillings.title')}</h1>
        </div>
        {serviceBilling && serviceBilling.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('serviceBillings.cancel.title')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('serviceBillings.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('serviceBillings.retry')}
            </Button>
          </div>
        </Alert>
      ) : !serviceBilling ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('serviceBillings.detail.notFound')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-6">
            {infoFields.map((field) => (
              <div key={field.label}>
                <div className="text-xs text-gray-500 dark:text-gray-400">{field.label}</div>
                <div className="text-sm">{field.value}</div>
              </div>
            ))}
          </div>

          <ServiceBillingCancelDialog
            isOpen={isCancelOpen}
            serviceBillingId={serviceBilling.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
