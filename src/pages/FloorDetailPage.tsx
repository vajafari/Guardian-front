import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getBuildingFloorById } from '../api/buildingFloorService';
import { deleteBuildingUnit } from '../api/buildingUnitService';
import { deleteBuildingParkingSpot } from '../api/buildingParkingSpotService';
import { deleteBuildingStorageRoom } from '../api/buildingStorageRoomService';
import type { BuildingFloorFullInfo } from '../types/buildingFloor';
import type { BuildingUnit } from '../types/buildingUnit';
import type { BuildingParkingSpot } from '../types/buildingParkingSpot';
import type { BuildingStorageRoom } from '../types/buildingStorageRoom';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { BuildingUnitFormDialog } from '../components/BuildingUnitFormDialog';
import { BuildingUnitViewDialog } from '../components/BuildingUnitViewDialog';
import { BuildingParkingSpotFormDialog } from '../components/BuildingParkingSpotFormDialog';
import { BuildingStorageRoomFormDialog } from '../components/BuildingStorageRoomFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

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
  const [isParkingSpotFormOpen, setIsParkingSpotFormOpen] = useState(false);
  const [editingParkingSpot, setEditingParkingSpot] = useState<BuildingParkingSpot | null>(null);
  const [isStorageRoomFormOpen, setIsStorageRoomFormOpen] = useState(false);
  const [editingStorageRoom, setEditingStorageRoom] = useState<BuildingStorageRoom | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<BuildingUnit | null>(null);
  const [deletingParkingSpot, setDeletingParkingSpot] = useState<BuildingParkingSpot | null>(null);
  const [deletingStorageRoom, setDeletingStorageRoom] = useState<BuildingStorageRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const confirmDeleteUnit = async () => {
    if (!deletingUnit) return;
    setIsDeleting(true);
    try {
      await deleteBuildingUnit(deletingUnit.id);
      setDeletingUnit(null);
      load();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddParkingSpot = () => {
    setEditingParkingSpot(null);
    setIsParkingSpotFormOpen(true);
  };

  const openEditParkingSpot = (spot: BuildingParkingSpot) => {
    setEditingParkingSpot(spot);
    setIsParkingSpotFormOpen(true);
  };

  const confirmDeleteParkingSpot = async () => {
    if (!deletingParkingSpot) return;
    setIsDeleting(true);
    try {
      await deleteBuildingParkingSpot(deletingParkingSpot.id);
      setDeletingParkingSpot(null);
      load();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddStorageRoom = () => {
    setEditingStorageRoom(null);
    setIsStorageRoomFormOpen(true);
  };

  const openEditStorageRoom = (room: BuildingStorageRoom) => {
    setEditingStorageRoom(room);
    setIsStorageRoomFormOpen(true);
  };

  const confirmDeleteStorageRoom = async () => {
    if (!deletingStorageRoom) return;
    setIsDeleting(true);
    try {
      await deleteBuildingStorageRoom(deletingStorageRoom.id);
      setDeletingStorageRoom(null);
      load();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const unitTitleById = (unitId: string | null) => {
    if (!unitId || !floor) return '—';
    return floor.unitsFullInfo.find((unit) => unit.id === unitId)?.title.toString() ?? '—';
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
                          <Button variant="plain" size="xs" icon={<HiOutlineTrash />} onClick={() => setDeletingUnit(unit)} />
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

          <div className="flex items-center justify-between mb-3 mt-6">
            <h4>{t('buildingParkingSpots.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAddParkingSpot}>
              {t('buildingParkingSpots.addButton')}
            </Button>
          </div>

          {floor.parkingSpotsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildingParkingSpots.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingParkingSpots.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingParkingSpots.fields.parkingSpotNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingParkingSpots.fields.buildingUnitId')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {floor.parkingSpotsFullInfo.map((spot) => (
                    <tr
                      key={spot.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{spot.title}</td>
                      <td className="py-2 px-3">{spot.parkingSpotNumber}</td>
                      <td className="py-2 px-3">{unitTitleById(spot.buildingUnitId)}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlinePencil />}
                            onClick={() => openEditParkingSpot(spot)}
                          />
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlineTrash />}
                            onClick={() => setDeletingParkingSpot(spot)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <BuildingParkingSpotFormDialog
            isOpen={isParkingSpotFormOpen}
            buildingFloorId={floor.id}
            units={floor.unitsFullInfo}
            parkingSpot={editingParkingSpot}
            onClose={() => setIsParkingSpotFormOpen(false)}
            onSaved={load}
          />

          <div className="flex items-center justify-between mb-3 mt-6">
            <h4>{t('buildingStorageRooms.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAddStorageRoom}>
              {t('buildingStorageRooms.addButton')}
            </Button>
          </div>

          {floor.storageRoomsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('buildingStorageRooms.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingStorageRooms.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingStorageRooms.fields.storageRoomNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('buildingStorageRooms.fields.buildingUnitId')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {floor.storageRoomsFullInfo.map((room) => (
                    <tr
                      key={room.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{room.title}</td>
                      <td className="py-2 px-3">{room.storageRoomNumber}</td>
                      <td className="py-2 px-3">{unitTitleById(room.buildingUnitId)}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlinePencil />}
                            onClick={() => openEditStorageRoom(room)}
                          />
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlineTrash />}
                            onClick={() => setDeletingStorageRoom(room)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <BuildingStorageRoomFormDialog
            isOpen={isStorageRoomFormOpen}
            buildingFloorId={floor.id}
            units={floor.unitsFullInfo}
            storageRoom={editingStorageRoom}
            onClose={() => setIsStorageRoomFormOpen(false)}
            onSaved={load}
          />

          <ConfirmDialog
            isOpen={!!deletingUnit}
            message={t('buildingUnits.deleteConfirm', { title: deletingUnit?.title })}
            isConfirming={isDeleting}
            onConfirm={confirmDeleteUnit}
            onClose={() => setDeletingUnit(null)}
          />
          <ConfirmDialog
            isOpen={!!deletingParkingSpot}
            message={t('buildingParkingSpots.deleteConfirm', { title: deletingParkingSpot?.title })}
            isConfirming={isDeleting}
            onConfirm={confirmDeleteParkingSpot}
            onClose={() => setDeletingParkingSpot(null)}
          />
          <ConfirmDialog
            isOpen={!!deletingStorageRoom}
            message={t('buildingStorageRooms.deleteConfirm', { title: deletingStorageRoom?.title })}
            isConfirming={isDeleting}
            onConfirm={confirmDeleteStorageRoom}
            onClose={() => setDeletingStorageRoom(null)}
          />
        </>
      )}
    </Card>
  );
}
