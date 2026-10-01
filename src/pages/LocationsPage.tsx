import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus } from 'react-icons/hi';
import { listLocations } from '../api/locationService';
import type { Location } from '../types/location';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { LocationFormDialog } from '../components/LocationFormDialog';

export function LocationsPage() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const load = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await listLocations();
      setLocations(result);
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
    setEditingLocation(null);
    setIsFormOpen(true);
  };

  const openEdit = (location: Location) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const parentTitleById = (parentId: string | null) => {
    if (!parentId) return '—';
    return locations.find((location) => location.id === parentId)?.title ?? '—';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('locations.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('locations.addButton')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('locations.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('locations.retry')}
            </Button>
          </div>
        </Alert>
      ) : locations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('locations.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('locations.fields.locationNumber')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('locations.fields.title')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('locations.fields.parentLocationId')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('locations.fields.isAutoSyncDisabled')}
                </th>
                <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="py-2 px-3">{location.locationNumber}</td>
                  <td className="py-2 px-3">{location.title}</td>
                  <td className="py-2 px-3">{parentTitleById(location.parentLocationId)}</td>
                  <td className="py-2 px-3">
                    {location.isAutoSyncDisabled ? t('persons.detail.yes') : t('persons.detail.no')}
                  </td>
                  <td className="py-2 px-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(location)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LocationFormDialog
        isOpen={isFormOpen}
        location={editingLocation}
        locations={locations}
        onClose={() => setIsFormOpen(false)}
        onSaved={load}
      />
    </Card>
  );
}
