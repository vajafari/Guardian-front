import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineUserGroup } from 'react-icons/hi';
import { getCabinetRoomById } from '../api/cabinetRoomService';
import { listLocations } from '../api/locationService';
import type { Cabinet, CabinetRoom } from '../types/cabinetRoom';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { CabinetRoomFormDialog } from '../components/CabinetRoomFormDialog';
import { CabinetPersonsDialog } from '../components/CabinetPersonsDialog';

export function CabinetRoomDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [cabinetRoom, setCabinetRoom] = useState<CabinetRoom | null>(null);
  const [locationTitle, setLocationTitle] = useState('—');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [managingCabinet, setManagingCabinet] = useState<Cabinet | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const [cabinetRoomResult, locations] = await Promise.all([getCabinetRoomById(id), listLocations()]);
      setCabinetRoom(cabinetRoomResult);
      setLocationTitle(locations.find((l) => l.id === cabinetRoomResult?.locationId)?.title ?? '—');
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

  const infoFields: Array<{ label: string; value: string }> = cabinetRoom
    ? [
        { label: t('cabinetRooms.fields.capacity'), value: String(cabinetRoom.capacity) },
        { label: t('cabinetRooms.fields.location'), value: locationTitle },
        { label: t('cabinetRooms.fields.isShared'), value: cabinetRoom.isShared ? t('persons.detail.yes') : t('persons.detail.no') },
        { label: t('cabinetRooms.fields.isAuto'), value: cabinetRoom.isAuto ? t('persons.detail.yes') : t('persons.detail.no') },
        { label: t('cabinetRooms.fields.isMultiple'), value: cabinetRoom.isMultiple ? t('persons.detail.yes') : t('persons.detail.no') },
        { label: t('cabinetRooms.fields.isActive'), value: cabinetRoom.isActive ? t('persons.detail.yes') : t('persons.detail.no') },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/cabinet-rooms')}>
            {t('cabinetRooms.detail.back')}
          </Button>
          <h1>{cabinetRoom ? cabinetRoom.title : t('cabinetRooms.title')}</h1>
        </div>
        {cabinetRoom && (
          <Button size="sm" icon={<HiOutlinePencil />} onClick={() => setIsEditOpen(true)}>
            {t('cabinetRooms.editTitle')}
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
            <span>{t('cabinetRooms.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('cabinetRooms.retry')}
            </Button>
          </div>
        </Alert>
      ) : !cabinetRoom ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('cabinetRooms.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('cabinetRooms.cabinets.title')}</h4>

          {cabinetRoom.cabinets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('cabinetRooms.cabinets.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cabinetRooms.cabinets.cabinetNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cabinetRooms.cabinets.description')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('cabinetRooms.cabinets.personCount')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {cabinetRoom.cabinets.map((cabinet) => (
                    <tr
                      key={cabinet.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{cabinet.cabinetNumber}</td>
                      <td className="py-2 px-3">{cabinet.description ?? '—'}</td>
                      <td className="py-2 px-3">{cabinet.personIds.length}</td>
                      <td className="py-2 px-3 text-end">
                        <Button
                          variant="plain"
                          size="xs"
                          icon={<HiOutlineUserGroup />}
                          onClick={() => setManagingCabinet(cabinet)}
                        >
                          {t('cabinetRooms.cabinetPersons.manageButton')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <CabinetRoomFormDialog isOpen={isEditOpen} cabinetRoom={cabinetRoom} onClose={() => setIsEditOpen(false)} onSaved={load} />
          <CabinetPersonsDialog
            isOpen={!!managingCabinet}
            cabinetId={managingCabinet?.id ?? null}
            cabinetNumber={managingCabinet?.cabinetNumber ?? null}
            initialPersonIds={managingCabinet?.personIds ?? []}
            onClose={() => setManagingCabinet(null)}
            onSaved={load}
          />
        </>
      )}
    </Card>
  );
}
