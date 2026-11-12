import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addBuildingDeposit, updateBuildingDeposit } from '../api/buildingDepositService';
import { searchAccountingEntities, searchAccountingEntityBuildings } from '../api/finReferenceDataService';
import { searchBuildingUnitsByBuilding } from '../api/buildingUnitService';
import { searchBuildingSpaces } from '../api/buildingSpaceService';
import { BuildingDepositError, type BuildingDepositErrorCode, type BuildingDepositFullInfo, type BuildingDepositKind } from '../types/buildingDeposit';
import type { FinAccountingEntity, FinAccountingEntityBuilding } from '../types/finReferenceData';
import type { BuildingUnit } from '../types/buildingUnit';
import type { BuildingSpace } from '../types/buildingSpace';
import { PartyPickerField } from './PartyPickerField';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const DEPOSIT_KINDS: BuildingDepositKind[] = [1, 2, 3, 9];

type TargetMode = 'none' | 'unit' | 'space';

interface BuildingDepositFormDialogProps {
  isOpen: boolean;
  buildingDeposit: BuildingDepositFullInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BuildingDepositFormDialog({ isOpen, buildingDeposit, onClose, onSaved }: BuildingDepositFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = buildingDeposit !== null;

  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [isChangingParty, setIsChangingParty] = useState(true);
  const [isChangingTarget, setIsChangingTarget] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [targetMode, setTargetMode] = useState<TargetMode>('none');
  const [buildingUnitId, setBuildingUnitId] = useState('');
  const [buildingSpaceId, setBuildingSpaceId] = useState('');
  const [depositKind, setDepositKind] = useState<BuildingDepositKind>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [buildings, setBuildings] = useState<FinAccountingEntityBuilding[]>([]);
  const [units, setUnits] = useState<BuildingUnit[]>([]);
  const [spaces, setSpaces] = useState<BuildingSpace[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BuildingDepositErrorCode | null>(null);

  const reset = () => {
    setAccountingEntityId(buildingDeposit?.accountingEntityId ?? '');
    setPartyId(buildingDeposit?.partyId ?? '');
    setIsChangingParty(!buildingDeposit);
    setIsChangingTarget(!buildingDeposit);
    setBuildingId('');
    setTargetMode('none');
    setBuildingUnitId(buildingDeposit?.buildingUnitId ?? '');
    setBuildingSpaceId(buildingDeposit?.buildingSpaceId ?? '');
    setDepositKind(buildingDeposit?.depositKind ?? 1);
    setTitle(buildingDeposit?.title ?? '');
    setDescription(buildingDeposit?.description ?? '');
    setBuildings([]);
    setUnits([]);
    setSpaces([]);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      searchAccountingEntities().then(setAccountingEntities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, buildingDeposit]);

  useEffect(() => {
    setBuildings([]);
    if (accountingEntityId) {
      searchAccountingEntityBuildings(accountingEntityId).then(setBuildings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountingEntityId]);

  const handleBuildingChange = (newBuildingId: string) => {
    setBuildingId(newBuildingId);
    setBuildingUnitId('');
    setBuildingSpaceId('');
    setUnits([]);
    setSpaces([]);
    if (!newBuildingId) {
      setTargetMode('none');
      return;
    }
    setTargetMode('unit');
    Promise.all([searchBuildingUnitsByBuilding(newBuildingId), searchBuildingSpaces({ buildingIds: [newBuildingId] })]).then(
      ([unitsResult, spacesResult]) => {
        setUnits(unitsResult);
        setSpaces(spacesResult);
      },
    );
  };

  const handleTargetModeChange = (newMode: TargetMode) => {
    setTargetMode(newMode);
    setBuildingUnitId('');
    setBuildingSpaceId('');
  };

  const existingTargetLabel = buildingDeposit?.buildingUnitTitle ?? buildingDeposit?.buildingSpaceTitle ?? t('buildingDeposits.noTarget');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: buildingDeposit?.id,
      accountingEntityId,
      partyId,
      buildingUnitId: targetMode === 'unit' ? buildingUnitId || null : isChangingTarget ? null : buildingDeposit?.buildingUnitId ?? null,
      buildingSpaceId: targetMode === 'space' ? buildingSpaceId || null : isChangingTarget ? null : buildingDeposit?.buildingSpaceId ?? null,
      depositKind,
      title: title.trim(),
      description: description.trim() || null,
    };

    try {
      if (isEdit) {
        await updateBuildingDeposit(payload);
      } else {
        await addBuildingDeposit(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof BuildingDepositError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={680}>
      <h4 className="mb-4">{isEdit ? t('buildingDeposits.editTitle') : t('buildingDeposits.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`buildingDeposits.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('buildingDeposits.fields.accountingEntity')} htmlFor="buildingDepositAccountingEntity">
              {isEdit ? (
                <Input id="buildingDepositAccountingEntity" value={buildingDeposit?.accountingEntityTitle ?? ''} disabled />
              ) : (
                <select
                  id="buildingDepositAccountingEntity"
                  className="input"
                  value={accountingEntityId}
                  onChange={(event) => setAccountingEntityId(event.target.value)}
                  required
                >
                  <option value="">—</option>
                  {accountingEntities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.title}
                    </option>
                  ))}
                </select>
              )}
            </FormItem>
            <FormItem label={t('buildingDeposits.fields.depositKind')} htmlFor="buildingDepositKind">
              <select
                id="buildingDepositKind"
                className="input"
                value={depositKind}
                onChange={(event) => setDepositKind(Number(event.target.value) as BuildingDepositKind)}
                required
              >
                {DEPOSIT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`buildingDeposits.depositKinds.${kind}`)}
                  </option>
                ))}
              </select>
            </FormItem>
          </div>

          {isChangingParty ? (
            <PartyPickerField isOpen={isOpen} onResolved={setPartyId} />
          ) : (
            <FormItem label={t('buildingDeposits.fields.party')} htmlFor="buildingDepositPartyDisplay">
              <div className="flex items-center gap-3">
                <Input id="buildingDepositPartyDisplay" value={buildingDeposit?.partyDisplayName ?? ''} disabled />
                <Button type="button" size="sm" onClick={() => setIsChangingParty(true)}>
                  {t('buildingDeposits.changeParty')}
                </Button>
              </div>
            </FormItem>
          )}

          {isChangingTarget ? (
            <>
              <FormItem label={t('buildingDeposits.fields.building')} htmlFor="buildingDepositBuilding">
                <select
                  id="buildingDepositBuilding"
                  className="input"
                  value={buildingId}
                  onChange={(event) => handleBuildingChange(event.target.value)}
                  disabled={!accountingEntityId}
                >
                  <option value="">—</option>
                  {buildings.map((building) => (
                    <option key={building.buildingId} value={building.buildingId}>
                      {building.buildingTitle}
                    </option>
                  ))}
                </select>
              </FormItem>

              {buildingId && (
                <div className="grid grid-cols-2 gap-3">
                  <FormItem label={t('buildingDeposits.fields.targetType')} htmlFor="buildingDepositTargetType">
                    <div className="flex items-center gap-4 h-full">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name="buildingDepositTargetType" checked={targetMode === 'unit'} onChange={() => handleTargetModeChange('unit')} />
                        {t('buildingDeposits.targetTypes.unit')}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name="buildingDepositTargetType" checked={targetMode === 'space'} onChange={() => handleTargetModeChange('space')} />
                        {t('buildingDeposits.targetTypes.space')}
                      </label>
                    </div>
                  </FormItem>
                  {targetMode === 'unit' ? (
                    <FormItem label={t('buildingDeposits.fields.buildingUnit')} htmlFor="buildingDepositUnit">
                      <select id="buildingDepositUnit" className="input" value={buildingUnitId} onChange={(event) => setBuildingUnitId(event.target.value)}>
                        <option value="">—</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.title}
                          </option>
                        ))}
                      </select>
                    </FormItem>
                  ) : (
                    <FormItem label={t('buildingDeposits.fields.buildingSpace')} htmlFor="buildingDepositSpace">
                      <select id="buildingDepositSpace" className="input" value={buildingSpaceId} onChange={(event) => setBuildingSpaceId(event.target.value)}>
                        <option value="">—</option>
                        {spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.spaceNumber}
                          </option>
                        ))}
                      </select>
                    </FormItem>
                  )}
                </div>
              )}
            </>
          ) : (
            <FormItem label={t('buildingDeposits.fields.target')} htmlFor="buildingDepositTargetDisplay">
              <div className="flex items-center gap-3">
                <Input id="buildingDepositTargetDisplay" value={existingTargetLabel} disabled />
                <Button type="button" size="sm" onClick={() => setIsChangingTarget(true)}>
                  {t('buildingDeposits.changeTarget')}
                </Button>
              </div>
            </FormItem>
          )}

          <FormItem label={t('buildingDeposits.fields.title')} htmlFor="buildingDepositTitle">
            <Input id="buildingDepositTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </FormItem>

          <FormItem label={t('buildingDeposits.fields.description')} htmlFor="buildingDepositDescription">
            <Input id="buildingDepositDescription" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('buildingDeposits.saving') : t('buildingDeposits.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
