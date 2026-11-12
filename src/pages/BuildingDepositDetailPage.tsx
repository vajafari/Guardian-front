import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBan, HiOutlinePencil, HiOutlinePlus } from 'react-icons/hi';
import { getBuildingDepositById } from '../api/buildingDepositService';
import type { BuildingDepositFullInfo } from '../types/buildingDeposit';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { BuildingDepositFormDialog } from '../components/BuildingDepositFormDialog';
import { BuildingDepositMovementFormDialog } from '../components/BuildingDepositMovementFormDialog';
import { BuildingDepositMovementCancelDialog } from '../components/BuildingDepositMovementCancelDialog';

export function BuildingDepositDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [buildingDeposit, setBuildingDeposit] = useState<BuildingDepositFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [cancellingMovementId, setCancellingMovementId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getBuildingDepositById(id);
      setBuildingDeposit(result);
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

  const infoFields: Array<{ label: string; value: string }> = buildingDeposit
    ? [
        { label: t('buildingDeposits.fields.party'), value: buildingDeposit.partyDisplayName },
        { label: t('buildingDeposits.fields.target'), value: buildingDeposit.buildingUnitTitle ?? buildingDeposit.buildingSpaceTitle ?? '—' },
        { label: t('buildingDeposits.fields.depositKind'), value: t(`buildingDeposits.depositKinds.${buildingDeposit.depositKind}`) },
        { label: t('buildingDeposits.fields.heldAmount'), value: buildingDeposit.heldAmount.toLocaleString() },
        { label: t('buildingDeposits.fields.description'), value: buildingDeposit.description ?? '—' },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/building-deposits')}>
            {t('buildingDeposits.detail.back')}
          </Button>
          <h1>{buildingDeposit ? buildingDeposit.title : t('buildingDeposits.title')}</h1>
        </div>
        {buildingDeposit && (
          <div className="flex items-center gap-2">
            <Button size="sm" icon={<HiOutlinePencil />} onClick={() => setIsEditOpen(true)}>
              {t('buildingDeposits.detail.edit')}
            </Button>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setIsMovementFormOpen(true)}>
              {t('buildingDeposits.movements.addButton')}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('buildingDeposits.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('buildingDeposits.retry')}
            </Button>
          </div>
        </Alert>
      ) : !buildingDeposit ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildingDeposits.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('buildingDeposits.movements.title')}</h4>
          {buildingDeposit.movementsFullInfo.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('buildingDeposits.movements.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingDeposits.movements.fields.documentNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingDeposits.movements.fields.movementKind')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingDeposits.movements.fields.documentDate')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingDeposits.movements.fields.amount')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingDeposits.movements.fields.status')}
                    </th>
                    <th className="py-2 px-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {buildingDeposit.movementsFullInfo.map((movement) => (
                    <tr key={movement.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2 px-3">{movement.documentNumber}</td>
                      <td className="py-2 px-3">{t(`buildingDeposits.movements.movementKinds.${movement.movementKind}`)}</td>
                      <td className="py-2 px-3">{movement.documentDate}</td>
                      <td className="py-2 px-3">{movement.amount.toLocaleString()}</td>
                      <td className="py-2 px-3">{t(`buildingDeposits.movements.statuses.${movement.status}`)}</td>
                      <td className="py-2 px-3">
                        {movement.status === 2 && (
                          <Button variant="plain" size="xs" icon={<HiOutlineBan />} onClick={() => setCancellingMovementId(movement.id)} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <BuildingDepositFormDialog isOpen={isEditOpen} buildingDeposit={buildingDeposit} onClose={() => setIsEditOpen(false)} onSaved={load} />

          <BuildingDepositMovementFormDialog
            isOpen={isMovementFormOpen}
            buildingDeposit={buildingDeposit}
            onClose={() => setIsMovementFormOpen(false)}
            onSaved={load}
          />

          <BuildingDepositMovementCancelDialog
            isOpen={!!cancellingMovementId}
            movementId={cancellingMovementId}
            onClose={() => setCancellingMovementId(null)}
            onCancelled={load}
          />
        </>
      )}
    </Card>
  );
}
