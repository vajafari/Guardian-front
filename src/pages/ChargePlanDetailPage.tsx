import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getChargePlanById } from '../api/chargePlanService';
import { deleteChargeComponent, searchChargeComponentsByPlan } from '../api/chargeComponentService';
import type { ChargePlanFullInfo } from '../types/chargePlan';
import type { ChargeComponentFullInfo } from '../types/chargeComponent';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ChargePlanFormDialog } from '../components/ChargePlanFormDialog';
import { ChargeComponentFormDialog } from '../components/ChargeComponentFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ChargePlanDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [chargePlan, setChargePlan] = useState<ChargePlanFullInfo | null>(null);
  const [components, setComponents] = useState<ChargeComponentFullInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isComponentFormOpen, setIsComponentFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ChargeComponentFullInfo | null>(null);
  const [deletingComponent, setDeletingComponent] = useState<ChargeComponentFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const [planResult, componentsResult] = await Promise.all([getChargePlanById(id), searchChargeComponentsByPlan(id)]);
      setChargePlan(planResult);
      setComponents(componentsResult);
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

  const openAddComponent = () => {
    setEditingComponent(null);
    setIsComponentFormOpen(true);
  };

  const openEditComponent = (component: ChargeComponentFullInfo) => {
    setEditingComponent(component);
    setIsComponentFormOpen(true);
  };

  const confirmDeleteComponent = async () => {
    if (!deletingComponent) return;
    setIsDeleting(true);
    try {
      await deleteChargeComponent(deletingComponent.id);
      setDeletingComponent(null);
      load();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const infoFields: Array<{ label: string; value: string }> = chargePlan
    ? [
        { label: t('chargePlans.fields.accountingEntity'), value: chargePlan.accountingEntityTitle },
        { label: t('chargePlans.fields.dueDay'), value: String(chargePlan.dueDay) },
        { label: t('chargePlans.fields.graceDays'), value: String(chargePlan.graceDays) },
        { label: t('chargePlans.fields.lateFeeMode'), value: t(`chargePlans.lateFeeModes.${chargePlan.lateFeeMode}`) },
        { label: t('chargePlans.fields.lateFeeFund'), value: chargePlan.lateFeeFundTitle },
        { label: t('chargePlans.fields.rentIncomeFund'), value: chargePlan.rentIncomeFundTitle },
        { label: t('chargePlans.fields.roundingUnit'), value: String(chargePlan.roundingUnit) },
        {
          label: t('chargePlans.fields.autoCreateResidentUser'),
          value: chargePlan.autoCreateResidentUser ? t('persons.detail.yes') : t('persons.detail.no'),
        },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/fin/charge-plans')}>
            {t('chargePlans.detail.back')}
          </Button>
          <h1>{chargePlan ? chargePlan.accountingEntityTitle : t('chargePlans.title')}</h1>
        </div>
        {chargePlan && (
          <Button size="sm" icon={<HiOutlinePencil />} onClick={() => setIsEditOpen(true)}>
            {t('chargePlans.editTitle')}
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
            <span>{t('chargePlans.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('chargePlans.retry')}
            </Button>
          </div>
        </Alert>
      ) : !chargePlan ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('chargePlans.detail.notFound')}</p>
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

          <div className="flex items-center justify-between mb-3">
            <h4>{t('chargePlans.components.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAddComponent}>
              {t('chargePlans.components.addButton')}
            </Button>
          </div>

          {components.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('chargePlans.components.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargePlans.components.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargePlans.components.fields.modelKind')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargePlans.components.fields.amount')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargePlans.components.fields.splitMethod')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargePlans.components.fields.payerKind')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('chargePlans.components.fields.isActive')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {components.map((component) => (
                    <tr
                      key={component.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{component.title}</td>
                      <td className="py-2 px-3">{t(`chargePlans.components.modelKinds.${component.modelKind}`)}</td>
                      <td className="py-2 px-3">{component.amount != null ? component.amount.toLocaleString() : '—'}</td>
                      <td className="py-2 px-3">{t(`chargePlans.components.splitMethods.${component.splitMethod}`)}</td>
                      <td className="py-2 px-3">{t(`chargePlans.components.payerKinds.${component.payerKind}`)}</td>
                      <td className="py-2 px-3">{component.isActive ? t('persons.detail.yes') : t('persons.detail.no')}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEditComponent(component)} />
                          <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => setDeletingComponent(component)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ChargePlanFormDialog isOpen={isEditOpen} chargePlan={chargePlan} onClose={() => setIsEditOpen(false)} onSaved={load} />
          <ChargeComponentFormDialog
            isOpen={isComponentFormOpen}
            chargePlanId={chargePlan.id}
            chargeComponent={editingComponent}
            onClose={() => setIsComponentFormOpen(false)}
            onSaved={load}
          />
          <ConfirmDialog
            isOpen={!!deletingComponent}
            message={t('chargePlans.components.deleteConfirm', { title: deletingComponent?.title })}
            isConfirming={isDeleting}
            onConfirm={confirmDeleteComponent}
            onClose={() => setDeletingComponent(null)}
          />
        </>
      )}
    </Card>
  );
}
