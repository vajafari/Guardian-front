import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteBuildingSpace, mapBuildingSpaceGridRow, type BuildingSpaceGridRow } from '../api/buildingSpaceService';
import { BUILDING_SPACE_ENDPOINTS } from '../api/config';
import type { BuildingSpaceFullInfo } from '../types/buildingSpace';
import { Alert, Button, Card } from '../components/ui';
import { BuildingSpaceFormDialog } from '../components/BuildingSpaceFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function BuildingSpacesPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<BuildingSpaceFullInfo | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<BuildingSpaceFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingSpace(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: BuildingSpaceGridRow) => {
    setEditingSpace(mapBuildingSpaceGridRow(row));
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSpace) return;
    setIsDeleting(true);
    try {
      await deleteBuildingSpace(deletingSpace.id);
      setDeletingSpace(null);
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
        <h1>{t('buildingSpaces.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('buildingSpaces.addButton')}
        </Button>
      </div>

      <GridView<BuildingSpaceGridRow>
        ref={gridRef}
        dataUrl={BUILDING_SPACE_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('buildingSpaces.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('buildingSpaces.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'SpaceNumber',
            header: t('buildingSpaces.fields.spaceNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'SpaceType',
            header: t('buildingSpaces.fields.spaceType'),
            render: (row) => t(`buildingSpaces.spaceTypes.${row.SpaceType}`),
          },
          {
            propertyName: 'SpaceNature',
            header: t('buildingSpaces.fields.spaceNature'),
            render: (row) => t(`buildingSpaces.spaceNatures.${row.SpaceNature}`),
          },
          {
            propertyName: 'BuildingTitle',
            header: t('buildingSpaces.fields.building'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'BuildingFloorTitle',
            header: t('buildingSpaces.fields.buildingFloor'),
            render: (row) => row.BuildingFloorTitle || '—',
          },
          {
            propertyName: 'OwnerBuildingUnitTitle',
            header: t('buildingSpaces.fields.ownerBuildingUnit'),
            render: (row) => row.OwnerBuildingUnitTitle || '—',
          },
          {
            propertyName: 'IsActive',
            header: t('buildingSpaces.fields.isActive'),
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
              onClick={() => setDeletingSpace(mapBuildingSpaceGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('buildingSpaces.loadError')}
        </Alert>
      )}

      <BuildingSpaceFormDialog
        isOpen={isFormOpen}
        space={editingSpace}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingSpace}
        message={t('buildingSpaces.deleteConfirm', { title: deletingSpace?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingSpace(null)}
      />
    </Card>
  );
}
