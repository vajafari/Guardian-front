import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteChargePlan, getChargePlanById, type ChargePlanGridRow } from '../api/chargePlanService';
import { CHARGE_PLAN_ENDPOINTS } from '../api/config';
import { ChargePlanError, type ChargePlanFullInfo } from '../types/chargePlan';
import { Alert, Button, Card } from '../components/ui';
import { ChargePlanFormDialog } from '../components/ChargePlanFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ChargePlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChargePlan, setEditingChargePlan] = useState<ChargePlanFullInfo | null>(null);
  const [deletingChargePlan, setDeletingChargePlan] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingChargePlan(null);
    setIsFormOpen(true);
  };

  const openEdit = async (row: ChargePlanGridRow) => {
    setHasError(false);
    try {
      const full = await getChargePlanById(row.Id);
      if (full) {
        setEditingChargePlan(full);
        setIsFormOpen(true);
      }
    } catch {
      setHasError(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingChargePlan) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteChargePlan(deletingChargePlan.id);
      setDeletingChargePlan(null);
      gridRef.current?.reload();
    } catch (err) {
      setDeleteError(t(`chargePlans.errors.${err instanceof ChargePlanError ? err.code : 'unknown'}`));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('chargePlans.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('chargePlans.addButton')}
        </Button>
      </div>

      <GridView<ChargePlanGridRow>
        ref={gridRef}
        dataUrl={CHARGE_PLAN_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('chargePlans.empty')}
        onRowClick={(row) => navigate(`/fin/charge-plans/${row.Id}`)}
        columns={[
          {
            propertyName: 'AccountingEntityTitle',
            header: t('chargePlans.fields.accountingEntity'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'DueDay',
            header: t('chargePlans.fields.dueDay'),
            sortable: true,
          },
          {
            propertyName: 'LateFeeMode',
            header: t('chargePlans.fields.lateFeeMode'),
            render: (row) => t(`chargePlans.lateFeeModes.${row.LateFeeMode}`),
          },
          {
            propertyName: 'LateFeeFundTitle',
            header: t('chargePlans.fields.lateFeeFund'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'RentIncomeFundTitle',
            header: t('chargePlans.fields.rentIncomeFund'),
            sortable: true,
            filterOperator: 'like',
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingChargePlan({ id: row.Id, title: row.AccountingEntityTitle })}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('chargePlans.loadError')}
        </Alert>
      )}

      <ChargePlanFormDialog
        isOpen={isFormOpen}
        chargePlan={editingChargePlan}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingChargePlan}
        message={t('chargePlans.deleteConfirm', { title: deletingChargePlan?.title })}
        error={deleteError}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingChargePlan(null)}
      />
    </Card>
  );
}
