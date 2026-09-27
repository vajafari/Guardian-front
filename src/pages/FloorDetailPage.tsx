import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getBuildingFloorById } from '../api/buildingFloorService';
import { deleteBuildingUnit } from '../api/buildingUnitService';
import type { BuildingFloorFullInfo } from '../types/buildingFloor';
import type { BuildingUnit } from '../types/buildingUnit';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { BuildingUnitFormDialog } from '../components/BuildingUnitFormDialog';
import { BuildingUnitViewDialog } from '../components/BuildingUnitViewDialog';

export function FloorDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [floor, setFloor] = useState<BuildingFloorFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BuildingUnit | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingUnit, setViewingUnit] = useState<BuildingUnit | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getBuildingFloorById(id);
      setFloor(result);
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

  const openAdd = () => {
    setEditingUnit(null);
    setIsFormOpen(true);
  };

  const openEdit = (unit: BuildingUnit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  const openView = (unit: BuildingUnit) => {
    setViewingUnit(unit);
    setIsViewOpen(true);
  };

  const handleDelete = async (unit: BuildingUnit) => {
    if (!window.confirm(t('buildingUnits.deleteConfirm', { title: unit.title }))) {
      return;
    }
    try {
      await deleteBuildingUnit(unit.id);
      load();
    } catch {
      setHasError(true);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="plain"
          size="sm"
          icon={<HiOutlineArrowLeft />}
          onClick={() => navigate(floor ? `/buildings/${floor.buildingId}` : '/buildings')}
        >
          {t('buildings.detail.back')}
        </Button>
        <h1>{floor ? t('buildingFloors.detail.pageTitle', { title: floor.title }) : t('buildingFloors.title')}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('buildingFloors.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('buildings.retry')}
            </Button>
          </div>
        </Alert>
      ) : !floor ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildingFloors.detail.notFound')}</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 mt-2">
            <h4>{t('buildingUnits.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
              {t('buildingUnits.addButton')}
            </Button>
          </div>

          {floor.unitsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildingUnits.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingUnits.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingUnits.fields.unitType')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingUnits.fields.isEmpty')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {floor.unitsFullInfo.map((unit) => (
                    <tr
                      key={unit.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{unit.title}</td>
                      <td className="py-2 px-3">{t(`buildingUnits.unitTypes.${unit.unitType}`)}</td>
                      <td className="py-2 px-3">{unit.isEmpty ? t('persons.detail.yes') : t('persons.detail.no')}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="plain" size="xs" icon={<HiOutlineEye />} onClick={() => openView(unit)} />
                          <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(unit)} />
                          <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => handleDelete(unit)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <BuildingUnitFormDialog
            isOpen={isFormOpen}
            buildingFloorId={floor.id}
            unit={editingUnit}
            onClose={() => setIsFormOpen(false)}
            onSaved={load}
          />
          <BuildingUnitViewDialog isOpen={isViewOpen} unit={viewingUnit} onClose={() => setIsViewOpen(false)} />
        </>
      )}
    </Card>
  );
}
