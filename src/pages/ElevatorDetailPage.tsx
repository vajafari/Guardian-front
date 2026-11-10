import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineUserGroup } from 'react-icons/hi';
import { getElevatorById } from '../api/elevatorService';
import { searchElevatorFloorsByElevator } from '../api/elevatorFloorService';
import { searchBuildings } from '../api/buildingService';
import { listLocations } from '../api/locationService';
import type { Elevator, ElevatorFloorFullInfo } from '../types/elevator';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ElevatorFormDialog } from '../components/ElevatorFormDialog';
import { ElevatorFloorPersonsDialog } from '../components/ElevatorFloorPersonsDialog';

export function ElevatorDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [elevator, setElevator] = useState<Elevator | null>(null);
  const [floors, setFloors] = useState<ElevatorFloorFullInfo[]>([]);
  const [buildingTitle, setBuildingTitle] = useState('—');
  const [locationTitle, setLocationTitle] = useState('—');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [managingFloor, setManagingFloor] = useState<ElevatorFloorFullInfo | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const [elevatorResult, floorsResult, buildings, locations] = await Promise.all([
        getElevatorById(id),
        searchElevatorFloorsByElevator(id),
        searchBuildings(),
        listLocations(),
      ]);
      setElevator(elevatorResult);
      setFloors(floorsResult);
      setBuildingTitle(buildings.find((b) => b.id === elevatorResult?.buildingId)?.title ?? '—');
      setLocationTitle(locations.find((l) => l.id === elevatorResult?.locationId)?.title ?? '—');
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

  const infoFields: Array<{ label: string; value: string }> = elevator
    ? [
        { label: t('elevators.fields.floorCount'), value: String(elevator.floorCount) },
        { label: t('elevators.fields.building'), value: buildingTitle },
        { label: t('elevators.fields.location'), value: locationTitle },
        { label: t('elevators.fields.validFloors'), value: elevator.validFloors.join(', ') || '—' },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/elevators')}>
            {t('elevators.detail.back')}
          </Button>
          <h1>{elevator ? elevator.title : t('elevators.title')}</h1>
        </div>
        {elevator && (
          <Button size="sm" icon={<HiOutlinePencil />} onClick={() => setIsEditOpen(true)}>
            {t('elevators.editTitle')}
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
            <span>{t('elevators.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('elevators.retry')}
            </Button>
          </div>
        </Alert>
      ) : !elevator ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('elevators.detail.notFound')}</p>
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

          <h4 className="mb-3">{t('elevators.floors.title')}</h4>

          {floors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('elevators.floors.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.floorTitle')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.actualFloorNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.hardwareFloorNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('elevators.floors.personCount')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {floors.map((floor) => (
                    <tr
                      key={floor.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{floor.title}</td>
                      <td className="py-2 px-3">{floor.actualFloorNumber}</td>
                      <td className="py-2 px-3">{floor.hardwareFloorNumber}</td>
                      <td className="py-2 px-3">{floor.personCount}</td>
                      <td className="py-2 px-3 text-end">
                        <Button
                          variant="plain"
                          size="xs"
                          icon={<HiOutlineUserGroup />}
                          onClick={() => setManagingFloor(floor)}
                        >
                          {t('elevators.floorPersons.manageButton')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ElevatorFormDialog isOpen={isEditOpen} elevator={elevator} onClose={() => setIsEditOpen(false)} onSaved={load} />
          <ElevatorFloorPersonsDialog
            isOpen={!!managingFloor}
            elevatorFloorId={managingFloor?.id ?? null}
            floorTitle={managingFloor?.title ?? ''}
            onClose={() => setManagingFloor(null)}
            onSaved={load}
          />
        </>
      )}
    </Card>
  );
}
