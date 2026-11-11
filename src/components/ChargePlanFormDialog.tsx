import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { saveChargePlan } from '../api/chargePlanService';
import { searchAccountingEntities, searchFunds } from '../api/finReferenceDataService';
import { listUserGroups } from '../api/userGroupService';
import { ChargePlanError, type ChargePlanFullInfo, type ChargePlanErrorCode } from '../types/chargePlan';
import type { LateFeeMode } from '../types/finSetup';
import type { FinAccountingEntity, FinFund } from '../types/finReferenceData';
import type { UserGroup } from '../types/userGroup';
import { Alert, Button, Dialog, FormContainer, FormItem, Input } from './ui';

const LATE_FEE_MODE_OPTIONS: LateFeeMode[] = [0, 1, 2];

interface ChargePlanFormDialogProps {
  isOpen: boolean;
  chargePlan: ChargePlanFullInfo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ChargePlanFormDialog({ isOpen, chargePlan, onClose, onSaved }: ChargePlanFormDialogProps) {
  const { t } = useTranslation();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [graceDays, setGraceDays] = useState('5');
  const [lateFeeMode, setLateFeeMode] = useState<LateFeeMode>(0);
  const [lateFeeRate, setLateFeeRate] = useState('0');
  const [lateFeeCapPercent, setLateFeeCapPercent] = useState('');
  const [lateFeeFundId, setLateFeeFundId] = useState('');
  const [rentIncomeFundId, setRentIncomeFundId] = useState('');
  const [roundingUnit, setRoundingUnit] = useState('1000');
  const [fundWarningBalance, setFundWarningBalance] = useState('');
  const [autoCreateResidentUser, setAutoCreateResidentUser] = useState(false);
  const [residentUserGroupId, setResidentUserGroupId] = useState('');
  const [description, setDescription] = useState('');

  const [accountingEntities, setAccountingEntities] = useState<FinAccountingEntity[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ChargePlanErrorCode | null>(null);

  const isEdit = chargePlan !== null;

  const reset = () => {
    setAccountingEntityId(chargePlan?.accountingEntityId ?? '');
    setDueDay(chargePlan ? String(chargePlan.dueDay) : '10');
    setGraceDays(chargePlan ? String(chargePlan.graceDays) : '5');
    setLateFeeMode(chargePlan?.lateFeeMode ?? 0);
    setLateFeeRate(chargePlan ? String(chargePlan.lateFeeRate) : '0');
    setLateFeeCapPercent(chargePlan?.lateFeeCapPercent != null ? String(chargePlan.lateFeeCapPercent) : '');
    setLateFeeFundId(chargePlan?.lateFeeFundId ?? '');
    setRentIncomeFundId(chargePlan?.rentIncomeFundId ?? '');
    setRoundingUnit(chargePlan ? String(chargePlan.roundingUnit) : '1000');
    setFundWarningBalance(chargePlan?.fundWarningBalance != null ? String(chargePlan.fundWarningBalance) : '');
    setAutoCreateResidentUser(chargePlan?.autoCreateResidentUser ?? false);
    setResidentUserGroupId(chargePlan?.residentUserGroupId ?? '');
    setDescription(chargePlan?.description ?? '');
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      Promise.all([searchAccountingEntities(), searchFunds(), listUserGroups()]).then(([entities, fundsResult, groups]) => {
        setAccountingEntities(entities);
        setFunds(fundsResult);
        setUserGroups(groups);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chargePlan]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      id: chargePlan?.id ?? crypto.randomUUID(),
      accountingEntityId,
      dueDay: Number(dueDay),
      graceDays: Number(graceDays),
      lateFeeMode,
      lateFeeRate: lateFeeMode === 0 ? 0 : Number(lateFeeRate),
      lateFeeCapPercent: lateFeeCapPercent ? Number(lateFeeCapPercent) : null,
      lateFeeFundId,
      rentIncomeFundId,
      roundingUnit: Number(roundingUnit),
      fundWarningBalance: fundWarningBalance ? Number(fundWarningBalance) : null,
      autoCreateResidentUser,
      residentUserGroupId: autoCreateResidentUser ? residentUserGroupId || null : null,
      description: description || null,
    };

    try {
      await saveChargePlan(payload, isEdit);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ChargePlanError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={720}>
      <h4 className="mb-4">{isEdit ? t('chargePlans.editTitle') : t('chargePlans.addTitle')}</h4>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`chargePlans.errors.${error}`)}
            </Alert>
          )}

          <FormItem label={t('chargePlans.fields.accountingEntity')} htmlFor="chargePlanAccountingEntity">
            <select
              id="chargePlanAccountingEntity"
              className="input"
              value={accountingEntityId}
              onChange={(event) => setAccountingEntityId(event.target.value)}
              disabled={isEdit}
              required
            >
              <option value="">—</option>
              {accountingEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.title}
                </option>
              ))}
            </select>
          </FormItem>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.fields.dueDay')} htmlFor="chargePlanDueDay">
              <Input id="chargePlanDueDay" type="number" min={1} max={29} value={dueDay} onChange={(event) => setDueDay(event.target.value)} required />
            </FormItem>
            <FormItem label={t('chargePlans.fields.graceDays')} htmlFor="chargePlanGraceDays">
              <Input id="chargePlanGraceDays" type="number" min={0} value={graceDays} onChange={(event) => setGraceDays(event.target.value)} required />
            </FormItem>
            <FormItem label={t('chargePlans.fields.roundingUnit')} htmlFor="chargePlanRoundingUnit">
              <Input
                id="chargePlanRoundingUnit"
                type="number"
                min={1}
                value={roundingUnit}
                onChange={(event) => setRoundingUnit(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.fields.lateFeeMode')} htmlFor="chargePlanLateFeeMode">
              <select
                id="chargePlanLateFeeMode"
                className="input"
                value={lateFeeMode}
                onChange={(event) => setLateFeeMode(Number(event.target.value) as LateFeeMode)}
              >
                {LATE_FEE_MODE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`chargePlans.lateFeeModes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            {lateFeeMode !== 0 && (
              <>
                <FormItem label={t('chargePlans.fields.lateFeeRate')} htmlFor="chargePlanLateFeeRate">
                  <Input
                    id="chargePlanLateFeeRate"
                    type="number"
                    min={0}
                    step="any"
                    value={lateFeeRate}
                    onChange={(event) => setLateFeeRate(event.target.value)}
                    required
                  />
                </FormItem>
                <FormItem label={t('chargePlans.fields.lateFeeCapPercent')} htmlFor="chargePlanLateFeeCapPercent">
                  <Input
                    id="chargePlanLateFeeCapPercent"
                    type="number"
                    min={0}
                    value={lateFeeCapPercent}
                    onChange={(event) => setLateFeeCapPercent(event.target.value)}
                  />
                </FormItem>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('chargePlans.fields.lateFeeFund')} htmlFor="chargePlanLateFeeFund">
              <select
                id="chargePlanLateFeeFund"
                className="input"
                value={lateFeeFundId}
                onChange={(event) => setLateFeeFundId(event.target.value)}
                required
              >
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargePlans.fields.rentIncomeFund')} htmlFor="chargePlanRentIncomeFund">
              <select
                id="chargePlanRentIncomeFund"
                className="input"
                value={rentIncomeFundId}
                onChange={(event) => setRentIncomeFundId(event.target.value)}
                required
              >
                <option value="">—</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label={t('chargePlans.fields.fundWarningBalance')} htmlFor="chargePlanFundWarningBalance">
              <Input
                id="chargePlanFundWarningBalance"
                type="number"
                min={0}
                value={fundWarningBalance}
                onChange={(event) => setFundWarningBalance(event.target.value)}
              />
            </FormItem>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none mb-3">
            <input
              type="checkbox"
              checked={autoCreateResidentUser}
              onChange={(event) => setAutoCreateResidentUser(event.target.checked)}
              className="accent-primary"
            />
            {t('chargePlans.fields.autoCreateResidentUser')}
          </label>

          {autoCreateResidentUser && (
            <FormItem label={t('chargePlans.fields.residentUserGroup')} htmlFor="chargePlanResidentUserGroup">
              <select
                id="chargePlanResidentUserGroup"
                className="input"
                value={residentUserGroupId}
                onChange={(event) => setResidentUserGroupId(event.target.value)}
                required
              >
                <option value="">—</option>
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
            </FormItem>
          )}

          <FormItem label={t('chargePlans.fields.description')} htmlFor="chargePlanDescription">
            <Input id="chargePlanDescription" textArea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormItem>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('chargePlans.saving') : t('chargePlans.save')}
          </Button>
        </FormContainer>
      </form>
    </Dialog>
  );
}
