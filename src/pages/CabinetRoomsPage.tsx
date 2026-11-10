import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteCabinetRoom, getCabinetRoomById, mapCabinetRoomGridRow, type CabinetRoomGridRow } from '../api/cabinetRoomService';
import { CABINET_ROOM_ENDPOINTS } from '../api/config';
import type { CabinetRoom, CabinetRoomFullInfo } from '../types/cabinetRoom';
import { Alert, Button, Card } from '../components/ui';
import { CabinetRoomFormDialog } from '../components/CabinetRoomFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function CabinetRoomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCabinetRoom, setEditingCabinetRoom] = useState<CabinetRoom | null>(null);
  const [deletingCabinetRoom, setDeletingCabinetRoom] = useState<CabinetRoomFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingCabinetRoom(null);
    setIsFormOpen(true);
  };

  const openEdit = async (row: CabinetRoomGridRow) => {
    setHasError(false);
    try {
      const full = await getCabinetRoomById(row.Id);
      setEditingCabinetRoom(full ?? mapCabinetRoomGridRow(row));
      setIsFormOpen(true);
    } catch {
      setHasError(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCabinetRoom) return;
    setIsDeleting(true);
    try {
      await deleteCabinetRoom(deletingCabinetRoom.id);
      setDeletingCabinetRoom(null);
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
        <h1>{t('cabinetRooms.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('cabinetRooms.addButton')}
        </Button>
      </div>

      <GridView<CabinetRoomGridRow>
        ref={gridRef}
        dataUrl={CABINET_ROOM_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('cabinetRooms.empty')}
        onRowClick={(row) => navigate(`/cabinet-rooms/${row.Id}`)}
        columns={[
          {
            propertyName: 'Title',
            header: t('cabinetRooms.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'Capacity',
            header: t('cabinetRooms.fields.capacity'),
            sortable: true,
          },
          {
            propertyName: 'LocationTitle',
            header: t('cabinetRooms.fields.location'),
            sortable: true,
            filterOperator: 'like',
            render: (row) => row.LocationTitle || '—',
          },
          {
            propertyName: 'IsShared',
            header: t('cabinetRooms.fields.isShared'),
            render: (row) => (row.IsShared ? t('persons.detail.yes') : t('persons.detail.no')),
          },
          {
            propertyName: 'IsAuto',
            header: t('cabinetRooms.fields.isAuto'),
            render: (row) => (row.IsAuto ? t('persons.detail.yes') : t('persons.detail.no')),
          },
          {
            propertyName: 'IsActive',
            header: t('cabinetRooms.fields.isActive'),
            sortable: true,
            render: (row) => (row.IsActive ? t('persons.detail.yes') : t('persons.detail.no')),
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingCabinetRoom(mapCabinetRoomGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('cabinetRooms.loadError')}
        </Alert>
      )}

      <CabinetRoomFormDialog
        isOpen={isFormOpen}
        cabinetRoom={editingCabinetRoom}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingCabinetRoom}
        message={t('cabinetRooms.deleteConfirm', { title: deletingCabinetRoom?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingCabinetRoom(null)}
      />
    </Card>
  );
}
