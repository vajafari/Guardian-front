import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { quickSetup } from '../api/finSetupService';
import { searchBuildings } from '../api/buildingService';
import { FinSetupError, type FinQuickSetupResult, type FinSetupErrorCode, type LateFeeMode } from '../types/finSetup';
import type { Building } from '../types/building';
import { Alert, Button, Card, FormContainer, FormItem, Input } from '../components/ui';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';

const LATE_FEE_MODE_OPTIONS: LateFeeMode[] = [0, 1, 2];

export function FinSetupPage() {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [fiscalYearTitle, setFiscalYearTitle] = useState('');
  const [fiscalYearStartDate, setFiscalYearStartDate] = useState('');
  const [fiscalYearEndDate, setFiscalYearEndDate] = useState('');
  const [bankAccountTitle, setBankAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sheba, setSheba] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [graceDays, setGraceDays] = useState('5');
  const [lateFeeMode, setLateFeeMode] = useState<LateFeeMode>(0);
  const [lateFeeRate, setLateFeeRate] = useState('');
  const [monthlyChargeAmount, setMonthlyChargeAmount] = useState('');
  const [monthlyReserveAmount, setMonthlyReserveAmount] = useState('0');

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FinSetupErrorCode | null>(null);
  const [result, setResult] = useState<FinQuickSetupResult | null>(null);

  useEffect(() => {
    searchBuildings().then(setBuildings);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      buildingIds,
      fiscalYearTitle,
      fiscalYearStartDate,
      fiscalYearEndDate,
      bankAccountTitle,
      bankName: bankName || null,
      accountNumber: accountNumber || null,
      sheba: sheba || null,
      dueDay: Number(dueDay),
      graceDays: Number(graceDays),
      lateFeeMode,
      lateFeeRate: lateFeeMode === 0 ? 0 : Number(lateFeeRate),
      monthlyChargeAmount: Number(monthlyChargeAmount),
      monthlyReserveAmount: Number(monthlyReserveAmount) || 0,
    };

    try {
      const created = await quickSetup(payload);
      setResult(created);
    } catch (err) {
      setError(err instanceof FinSetupError ? err.code : 'unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <Card>
        <h1 className="mb-4">{t('finSetup.title')}</h1>
        <Alert type="success" className="mb-4">
          {t('finSetup.success.title')}
        </Alert>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('finSetup.success.accountingEntityId')}</div>
            <div className="font-mono">{result.accountingEntityId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('finSetup.success.fiscalYearId')}</div>
            <div className="font-mono">{result.fiscalYearId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('finSetup.success.cashAccountId')}</div>
            <div className="font-mono">{result.cashAccountId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('finSetup.success.chargePlanId')}</div>
            <div className="font-mono">{result.chargePlanId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('finSetup.success.chargeComponentCount')}</div>
            <div>{result.chargeComponentIds.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('finSetup.success.serviceBillingTypeCount')}</div>
            <div>{result.serviceBillingTypeIds.length}</div>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">{t('finSetup.success.whatsNext')}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-4">{t('finSetup.title')}</h1>

      <form onSubmit={handleSubmit}>
        <FormContainer>
          {error && (
            <Alert type="danger" className="mb-4">
              {t(`finSetup.errors.${error}`)}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('finSetup.fields.title')} htmlFor="finSetupTitle">
              <Input id="finSetupTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </FormItem>
            <FormItem label={t('finSetup.fields.buildings')} htmlFor="finSetupBuildings">
              <MultiSelectDropdown
                id="finSetupBuildings"
                options={buildings.map((building) => ({ value: building.id, label: building.title }))}
                selectedValues={buildingIds}
                onChange={setBuildingIds}
              />
            </FormItem>
          </div>

          <h5 className="mt-4 mb-2">{t('finSetup.sections.fiscalYear')}</h5>
          <div className="grid grid-cols-3 gap-3">
            <FormItem label={t('finSetup.fields.fiscalYearTitle')} htmlFor="finSetupFiscalYearTitle">
              <Input
                id="finSetupFiscalYearTitle"
                value={fiscalYearTitle}
                onChange={(event) => setFiscalYearTitle(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('finSetup.fields.fiscalYearStartDate')} htmlFor="finSetupFiscalYearStartDate">
              <Input
                id="finSetupFiscalYearStartDate"
                type="date"
                value={fiscalYearStartDate}
                onChange={(event) => setFiscalYearStartDate(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('finSetup.fields.fiscalYearEndDate')} htmlFor="finSetupFiscalYearEndDate">
              <Input
                id="finSetupFiscalYearEndDate"
                type="date"
                value={fiscalYearEndDate}
                onChange={(event) => setFiscalYearEndDate(event.target.value)}
                required
              />
            </FormItem>
          </div>

          <h5 className="mt-4 mb-2">{t('finSetup.sections.bankAccount')}</h5>
          <div className="grid grid-cols-4 gap-3">
            <FormItem label={t('finSetup.fields.bankAccountTitle')} htmlFor="finSetupBankAccountTitle">
              <Input
                id="finSetupBankAccountTitle"
                value={bankAccountTitle}
                onChange={(event) => setBankAccountTitle(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('finSetup.fields.bankName')} htmlFor="finSetupBankName">
              <Input id="finSetupBankName" value={bankName} onChange={(event) => setBankName(event.target.value)} />
            </FormItem>
            <FormItem label={t('finSetup.fields.accountNumber')} htmlFor="finSetupAccountNumber">
              <Input id="finSetupAccountNumber" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
            </FormItem>
            <FormItem label={t('finSetup.fields.sheba')} htmlFor="finSetupSheba">
              <Input id="finSetupSheba" value={sheba} onChange={(event) => setSheba(event.target.value)} />
            </FormItem>
          </div>

          <h5 className="mt-4 mb-2">{t('finSetup.sections.chargePlan')}</h5>
          <div className="grid grid-cols-4 gap-3">
            <FormItem label={t('finSetup.fields.dueDay')} htmlFor="finSetupDueDay">
              <Input id="finSetupDueDay" type="number" min={1} max={29} value={dueDay} onChange={(event) => setDueDay(event.target.value)} required />
            </FormItem>
            <FormItem label={t('finSetup.fields.graceDays')} htmlFor="finSetupGraceDays">
              <Input id="finSetupGraceDays" type="number" min={0} value={graceDays} onChange={(event) => setGraceDays(event.target.value)} />
            </FormItem>
            <FormItem label={t('finSetup.fields.lateFeeMode')} htmlFor="finSetupLateFeeMode">
              <select
                id="finSetupLateFeeMode"
                className="input"
                value={lateFeeMode}
                onChange={(event) => setLateFeeMode(Number(event.target.value) as LateFeeMode)}
              >
                {LATE_FEE_MODE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`finSetup.lateFeeModes.${value}`)}
                  </option>
                ))}
              </select>
            </FormItem>
            {lateFeeMode !== 0 && (
              <FormItem label={t('finSetup.fields.lateFeeRate')} htmlFor="finSetupLateFeeRate">
                <Input
                  id="finSetupLateFeeRate"
                  type="number"
                  min={0}
                  step="any"
                  value={lateFeeRate}
                  onChange={(event) => setLateFeeRate(event.target.value)}
                  required
                />
              </FormItem>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormItem label={t('finSetup.fields.monthlyChargeAmount')} htmlFor="finSetupMonthlyChargeAmount">
              <Input
                id="finSetupMonthlyChargeAmount"
                type="number"
                min={1}
                step={1}
                value={monthlyChargeAmount}
                onChange={(event) => setMonthlyChargeAmount(event.target.value)}
                required
              />
            </FormItem>
            <FormItem label={t('finSetup.fields.monthlyReserveAmount')} htmlFor="finSetupMonthlyReserveAmount">
              <Input
                id="finSetupMonthlyReserveAmount"
                type="number"
                min={0}
                step={1}
                value={monthlyReserveAmount}
                onChange={(event) => setMonthlyReserveAmount(event.target.value)}
              />
            </FormItem>
          </div>

          <Button variant="solid" block type="submit" loading={isSubmitting}>
            {isSubmitting ? t('finSetup.saving') : t('finSetup.save')}
          </Button>
        </FormContainer>
      </form>
    </Card>
  );
}
