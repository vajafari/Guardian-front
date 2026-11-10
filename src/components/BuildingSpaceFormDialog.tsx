import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingSpace, updateBuildingSpace } from '../api/buildingSpaceService';
import { getBuildingById, searchBuildings } from '../api/buildingService';
import { searchBuildingUnitsByBuilding } from '../api/buildingUnitService';
import { listLocations } from '../api/locationService';
import {
  BuildingSpaceError,
  type BuildingSpaceErrorCode,
  type BuildingSpaceFullInfo,
  type SpaceNature,
  type SpaceType,
} from '../types/buildingSpace';
import type { Building } from '../types/building';
import type { BuildingFloor } from '../types/buildingFloor';
import type { BuildingUnit } from '../types/buildingUnit';
import type { Location } from '../types/location';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

interface BuildingSpaceFormDialogProps {
  isOpen: boolean;
  space: BuildingSpaceFullInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

const EXCLUSIVE: SpaceNature = 1;
const SHARED: SpaceNature = 2;
const SPACE_TYPE_OPTIONS: SpaceType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99];
const SPACE_NATURE_OPTIONS: SpaceNature[] = [EXCLUSIVE, SHARED];

export function BuildingSpaceFormDialog({ isOpen, space, onClose, onSaved }: BuildingSpaceFormDialogProps) {
  const { t } = useTranslation();
  const [buildingId, setBuildingId] = useState('');
  const [buildingFloorId, setBuildingFloorId] = useState('');
  const [ownerBuildingUnitId, setOwnerBuildingUnitId] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>(1);
  const [spaceNature, setSpaceNature] = useState<SpaceNature>(EXCLUSIVE);
  const [spaceNumber, setSpaceNumber] = useState('');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isChargeable, setIsChargeable] = useState(false);
  const [isReservable, setIsReservable] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<BuildingFloor[]>([]);
  const [units, setUnits] = useState<BuildingUnit[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingSpaceErrorCode | null>(null);

  const isEdit = space !== null;

  const loadBuildingScopedData = async (id: string) => {
    if (!id) {
      setFloors([]);
      setUnits([]);
      return;
    }
    const [building, buildingUnits] = await Promise.all([getBuildingById(id), searchBuildingUnitsByBuilding(id)]);
    setFloors(building?.floorsFullInfo ?? []);
    setUnits(buildingUnits);
  };

  const reset = () => {
    setBuildingId(space?.buildingId ?? '');
    setBuildingFloorId(space?.buildingFloorId ?? '');
    setOwnerBuildingUnitId(space?.ownerBuildingUnitId ?? '');
    setSpaceType(space?.spaceType ?? 1);
    setSpaceNature(space?.spaceNature ?? EXCLUSIVE);
    setSpaceNumber(space?.spaceNumber ?? '');
    setTitle(space?.title ?? '');
    setArea(space?.area != null ? String(space.area) : '');
    setCapacity(space?.capacity != null ? String(space.capacity) : '');
    setIsChargeable(space?.isChargeable ?? false);
    setIsReservable(space?.isReservable ?? false);
    setLocationId(space?.locationId ?? '');
    setIsActive(space?.isActive ?? true);
    setDescription(space?.description ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchBuildings(), listLocations()]).then(([buildingsResult, locationsResult]) => {
        setBuildings(buildingsResult);
        setLocations(locationsResult);
      });
      loadBuildingScopedData(space?.buildingId ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, space]);

  const handleBuildingChange = (newBuildingId: string) => {
    setBuildingId(newBuildingId);
    setBuildingFloorId('');
    setOwnerBuildingUnitId('');
    loadBuildingScopedData(newBuildingId);
  };

  const handleSpaceNatureChange = (newSpaceNature: SpaceNature) => {
    setSpaceNature(newSpaceNature);
    if (newSpaceNature === SHARED) {
      setOwnerBuildingUnitId('');
      setIsChargeable(false);
    } else {
      setIsReservable(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: space?.id ?? crypto.randomUUID(),
      buildingId,
      buildingFloorId: buildingFloorId || null,
      ownerBuildingUnitId: spaceNature === EXCLUSIVE ? ownerBuildingUnitId || null : null,
      spaceType,
      spaceNature,
      spaceNumber,
      title,
      area: area === '' ? null : Number(area),
      capacity: capacity === '' ? null : Number(capacity),
      isChargeable: spaceNature === EXCLUSIVE ? isChargeable : false,
      isReservable: spaceNature === SHARED ? isReservable : false,
      locationId: locationId || null,
      isActive,
      description: description || null,
      settingsInJson: null,
    };

    try {
      if (isEdit) {
        await updateBuildingSpace(payload);
      } else {
        await addBuildingSpace(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingSpaceError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{isEdit ? t('buildingSpaces.editTitle') : t('buildingSpaces.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingSpaces.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('buildingSpaces.fields.building')} htmlFor="spaceBuilding">
              <select
                id="spaceBuilding"
                className="input"
                value={buildingId}
                onChange={(event) => handleBuildingChange(event.target.value)}
                required
              >
                <option value="">—</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('buildingSpaces.fields.buildingFloor')} htmlFor="spaceFloor">
              <select
                id="spaceFloor"
                className="input"
                value={buildingFloorId}
                onChange={(event) => setBuildingFloorId(event.target.value)}
              >
                <option value="">—</option>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('buildingSpaces.fields.spaceNumber')} htmlFor="spaceNumber">
              <Input id="spaceNumber" value={spaceNumber} onChange={(event) => setSpaceNumber(event.target.value)} required />
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('buildingSpaces.fields.title')} htmlFor="spaceTitle">
              <Input id="spaceTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('buildingSpaces.fields.spaceType')} htmlFor="spaceType">
              <select
                id="spaceType"
                className="input"
                value={spaceType}
                onChange={(event) => setSpaceType(Number(event.target.value) as SpaceType)}
              >
                {SPACE_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`buildingSpaces.spaceTypes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('buildingSpaces.fields.spaceNature')} htmlFor="spaceNature">
              <select
                id="spaceNature"
                className="input"
                value={spaceNature}
                onChange={(event) => handleSpaceNatureChange(Number(event.target.value) as SpaceNature)}
              >
                {SPACE_NATURE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`buildingSpaces.spaceNatures.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          {spaceNature === EXCLUSIVE && (
            <FormItem label={t('buildingSpaces.fields.ownerBuildingUnit')} htmlFor="spaceOwnerUnit">
              <select
                id="spaceOwnerUnit"
                className="input"
                value={ownerBuildingUnitId}
                onChange={(event) => setOwnerBuildingUnitId(event.target.value)}
              >
                <option value="">{t('buildingSpaces.ownedByBuilding')}</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </FormItem>
          )}

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('buildingSpaces.fields.area')} htmlFor="spaceArea">
              <Input id="spaceArea" type="number" step="0.01" value={area} onChange={(event) => setArea(event.target.value)} />
            </FormItem>
            <FormItem label={t('buildingSpaces.fields.capacity')} htmlFor="spaceCapacity">
              <Input id="spaceCapacity" type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </FormItem>
            <FormItem label={t('buildingSpaces.fields.location')} htmlFor="spaceLocation">
              <select id="spaceLocation" className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                <option value="">—</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          <div className="flex items-center gap-6 mb-3">
            {spaceNature === EXCLUSIVE && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={isChargeable}
                  onChange={(event) => setIsChargeable(event.target.checked)}
                  className="accent-primary"
                />
                {t('buildingSpaces.fields.isChargeable')}
              </label>
            )}
            {spaceNature === SHARED && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={isReservable}
                  onChange={(event) => setIsReservable(event.target.checked)}
                  className="accent-primary"
                />
                {t('buildingSpaces.fields.isReservable')}
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="accent-primary"
              />
              {t('buildingSpaces.fields.isActive')}
            </label>
          </div>

          <FormItem label={t('buildingSpaces.fields.description')} htmlFor="spaceDescription">
            <Input
              id="spaceDescription"
              textArea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('buildingSpaces.saving') : t('buildingSpaces.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
