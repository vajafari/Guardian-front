import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteBuildingDeposit, getBuildingDepositById, type BuildingDepositGridRow } from '../api/buildingDepositService';
import { BUILDING_DEPOSIT_ENDPOINTS } from '../api/config';
import { BuildingDepositError, type BuildingDepositFullInfo } from '../types/buildingDeposit';
import { Alert, Button, Card } from '../components/ui';
import { BuildingDepositFormDialog } from '../components/BuildingDepositFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function BuildingDepositsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<BuildingDepositFullInfo | null>(null);
  const [deletingDeposit, setDeletingDeposit] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  const openAdd = () => {
    setEditingDeposit(null);
    setIsFormOpen(true);
  };

  const openEdit = async (row: BuildingDepositGridRow) => {
    setHasLoadError(false);
    try {
      const full = await getBuildingDepositById(row.Id);
      if (full) {
        setEditingDeposit(full);
        setIsFormOpen(true);
      }
    } catch {
      setHasLoadError(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDeposit) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteBuildingDeposit(deletingDeposit.id);
      setDeletingDeposit(null);
      gridRef.current?.reload();
    } catch (err) {
      setDeleteError(t(`buildingDeposits.errors.${err instanceof BuildingDepositError ? err.code : 'unknown'}`));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('buildingDeposits.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('buildingDeposits.addButton')}
        </Button>
      </div>

      {hasLoadError && (
        <Alert type="danger" className="mb-2">
          {t('buildingDeposits.errors.unknown')}
        </Alert>
      )}

      <GridView<BuildingDepositGridRow>
        ref={gridRef}
        dataUrl={BUILDING_DEPOSIT_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('buildingDeposits.empty')}
        onRowClick={(row) => navigate(`/fin/building-deposits/${row.Id}`)}
        columns={[
          {
            propertyName: 'Title',
            header: t('buildingDeposits.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'PartyDisplayName',
            header: t('buildingDeposits.fields.party'),
            filterOperator: 'like',
          },
          {
            propertyName: 'BuildingUnitTitle',
            header: t('buildingDeposits.fields.target'),
            render: (row) => row.BuildingUnitTitle || row.BuildingSpaceTitle || '—',
          },
          {
            propertyName: 'DepositKind',
            header: t('buildingDeposits.fields.depositKind'),
            render: (row) => t(`buildingDeposits.depositKinds.${row.DepositKind}`),
          },
          {
            propertyName: 'HeldAmount',
            header: t('buildingDeposits.fields.heldAmount'),
            render: (row) => row.HeldAmount.toLocaleString(),
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingDeposit({ id: row.Id, title: row.Title })}
            />
          </>
        )}
      />

      {deleteError && (
        <Alert type="danger" className="mt-2">
          {deleteError}
        </Alert>
      )}

      <BuildingDepositFormDialog
        isOpen={isFormOpen}
        buildingDeposit={editingDeposit}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingDeposit}
        message={t('buildingDeposits.deleteConfirm', { title: deletingDeposit?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingDeposit(null)}
      />
    </Card>
  );
}
