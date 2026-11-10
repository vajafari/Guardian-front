import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteElevator, getElevatorById, mapElevatorGridRow, type ElevatorGridRow } from '../api/elevatorService';
import { ELEVATOR_ENDPOINTS } from '../api/config';
import type { Elevator, ElevatorFullInfo } from '../types/elevator';
import { Alert, Button, Card } from '../components/ui';
import { ElevatorFormDialog } from '../components/ElevatorFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ElevatorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingElevator, setEditingElevator] = useState<Elevator | null>(null);
  const [deletingElevator, setDeletingElevator] = useState<ElevatorFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingElevator(null);
    setIsFormOpen(true);
  };

  const openEdit = async (row: ElevatorGridRow) => {
    setHasError(false);
    try {
      const full = await getElevatorById(row.Id);
      setEditingElevator(full ?? mapElevatorGridRow(row));
      setIsFormOpen(true);
    } catch {
      setHasError(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingElevator) return;
    setIsDeleting(true);
    try {
      await deleteElevator(deletingElevator.id);
      setDeletingElevator(null);
      gridRef.current?.reload();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('elevators.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('elevators.addButton')}
        </Button>
      </div>

      <GridView<ElevatorGridRow>
        ref={gridRef}
        dataUrl={ELEVATOR_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('elevators.empty')}
        onRowClick={(row) => navigate(`/elevators/${row.Id}`)}
        columns={[
          {
            propertyName: 'Title',
            header: t('elevators.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'FloorCount',
            header: t('elevators.fields.floorCount'),
            sortable: true,
          },
          {
            propertyName: 'BuildingTitle',
            header: t('elevators.fields.building'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'LocationTitle',
            header: t('elevators.fields.location'),
            sortable: true,
            filterOperator: 'like',
            render: (row) => row.LocationTitle || '—',
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingElevator(mapElevatorGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('elevators.loadError')}
        </Alert>
      )}

      <ElevatorFormDialog
        isOpen={isFormOpen}
        elevator={editingElevator}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingElevator}
        message={t('elevators.deleteConfirm', { title: deletingElevator?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingElevator(null)}
      />
    </Card>
  );
}
