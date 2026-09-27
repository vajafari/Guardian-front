import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteBuilding, searchBuildings } from '../api/buildingService';
import type { Building } from '../types/building';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { BuildingFormDialog } from '../components/BuildingFormDialog';

export function BuildingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  const load = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await searchBuildings();
      setBuildings(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingBuilding(null);
    setIsFormOpen(true);
  };

  const openEdit = (building: Building) => {
    setEditingBuilding(building);
    setIsFormOpen(true);
  };

  const handleDelete = async (building: Building) => {
    if (!window.confirm(t('buildings.deleteConfirm', { title: building.title }))) {
      return;
    }
    try {
      await deleteBuilding(building.id);
      load();
    } catch {
      setHasError(true);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('buildings.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('buildings.addButton')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('buildings.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('buildings.retry')}
            </Button>
          </div>
        </Alert>
      ) : buildings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildings.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('buildings.fields.buildingNumber')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('buildings.fields.title')}
                </th>
                <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {buildings.map((building) => (
                <tr
                  key={building.id}
                  onClick={() => navigate(`/buildings/${building.id}`)}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                >
                  <td className="py-2 px-3">{building.buildingNumber}</td>
                  <td className="py-2 px-3">{building.title}</td>
                  <td className="py-2 px-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="plain"
                        size="xs"
                        icon={<HiOutlinePencil />}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(building);
                        }}
                      />
                      <Button
                        variant="plain"
                        size="xs"
                        icon={<HiOutlineTrash />}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(building);
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

      <BuildingFormDialog
        isOpen={isFormOpen}
        building={editingBuilding}
        onClose={() => setIsFormOpen(false)}
        onSaved={load}
      />
    </Card>
  );
}
