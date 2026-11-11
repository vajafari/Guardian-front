import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan } from 'react-icons/hi';
import { getPartyPaymentById } from '../api/partyPaymentService';
import type { PartyPaymentFullInfo } from '../types/partyPayment';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { PartyPaymentCancelDialog } from '../components/PartyPaymentCancelDialog';

export function PartyPaymentDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [partyPayment, setPartyPayment] = useState<PartyPaymentFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getPartyPaymentById(id);
      setPartyPayment(result);
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

  const infoFields: Array<{ label: string; value: string }> = partyPayment
    ? [
        { label: t('partyPayments.fields.accountingEntity'), value: partyPayment.accountingEntityTitle },
        { label: t('partyPayments.fields.party'), value: partyPayment.partyDisplayName },
        { label: t('partyPayments.fields.paymentMethod'), value: t(`partyPayments.paymentMethods.${partyPayment.paymentMethod}`) },
        { label: t('partyPayments.fields.cashAccount'), value: partyPayment.cashAccountTitle ?? '—' },
        { label: t('partyPayments.fields.amount'), value: partyPayment.amount.toLocaleString() },
        { label: t('partyPayments.fields.settledAmount'), value: partyPayment.settledAmount.toLocaleString() },
        { label: t('partyPayments.fields.unsettledAmount'), value: partyPayment.unsettledAmount.toLocaleString() },
        { label: t('partyPayments.fields.documentDate'), value: partyPayment.documentDate },
        { label: t('partyPayments.fields.status'), value: t(`partyPayments.statuses.${partyPayment.status}`) },
        { label: t('partyPayments.fields.description'), value: partyPayment.description ?? '—' },
      ]
    : [];

  if (partyPayment?.status === 3) {
    infoFields.push({ label: t('partyPayments.fields.cancelReason'), value: partyPayment.cancelReason ?? '—' });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/party-payments')}>
            {t('partyPayments.detail.back')}
          </Button>
          <h1>{partyPayment ? partyPayment.documentNumber : t('partyPayments.title')}</h1>
        </div>
        {partyPayment && partyPayment.status === 2 && (
          <Button size="sm" icon={<HiOutlineBan />} onClick={() => setIsCancelOpen(true)}>
            {t('partyPayments.cancel.title')}
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
            <span>{t('partyPayments.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('partyPayments.retry')}
            </Button>
          </div>
        </Alert>
      ) : !partyPayment ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('partyPayments.detail.notFound')}</p>
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

          {partyPayment.chequesFullInfo.length > 0 && (
            <>
              <h4 className="mb-3">{t('partyPayments.detail.cheques')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.chequeNumber')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.dueDate')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.amount')}
                      </th>
                      <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                        {t('cheques.fields.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyPayment.chequesFullInfo.map((cheque) => (
                      <tr key={cheque.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-2 px-3">{cheque.chequeNumber}</td>
                        <td className="py-2 px-3">{cheque.chequeDueDate}</td>
                        <td className="py-2 px-3">{cheque.chequeAmount.toLocaleString()}</td>
                        <td className="py-2 px-3">{t(`cheques.chequeStatuses.${cheque.chequeStatus}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <PartyPaymentCancelDialog
            isOpen={isCancelOpen}
            partyPaymentId={partyPayment.id}
            onClose={() => setIsCancelOpen(false)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
