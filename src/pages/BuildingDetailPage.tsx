import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getBuildingById } from '../api/buildingService';
import { deleteBuildingFloor } from '../api/buildingFloorService';
import type { BuildingFloor, BuildingFullInfo } from '../types/buildingFloor';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { BuildingFloorFormDialog } from '../components/BuildingFloorFormDialog';

export function BuildingDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [building, setBuilding] = useState<BuildingFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<BuildingFloor | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getBuildingById(id);
      setBuilding(result);
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
    setEditingFloor(null);
    setIsFormOpen(true);
  };

  const openEdit = (floor: BuildingFloor) => {
    setEditingFloor(floor);
    setIsFormOpen(true);
  };

  const handleDelete = async (floor: BuildingFloor) => {
    if (!window.confirm(t('buildingFloors.deleteConfirm', { title: floor.title }))) {
      return;
    }
    try {
      await deleteBuildingFloor(floor.id);
      load();
    } catch {
      setHasError(true);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/buildings')}>
          {t('buildings.detail.back')}
        </Button>
        <h1>{building ? t('buildings.detail.pageTitle', { title: building.title }) : t('buildings.title')}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('buildings.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('buildings.retry')}
            </Button>
          </div>
        </Alert>
      ) : !building ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildings.detail.notFound')}</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 mt-2">
            <h4>{t('buildingFloors.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
              {t('buildingFloors.addButton')}
            </Button>
          </div>

          {building.floorsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildingFloors.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingFloors.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingFloors.fields.floorActualNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingFloors.fields.floorHardwareNumber')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {building.floorsFullInfo.map((floor) => (
                    <tr
                      key={floor.id}
                      onClick={() => navigate(`/floors/${floor.id}`)}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                    >
                      <td className="py-2 px-3">{floor.title}</td>
                      <td className="py-2 px-3">{floor.floorActualNumber}</td>
                      <td className="py-2 px-3">{floor.floorHardwareNumber}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlinePencil />}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEdit(floor);
                            }}
                          />
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlineTrash />}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(floor);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <BuildingFloorFormDialog
            isOpen={isFormOpen}
            buildingId={building.id}
            floor={editingFloor}
            onClose={() => setIsFormOpen(false)}
            onSaved={load}
          />
        </>
      )}
    </Card>
  );
}
