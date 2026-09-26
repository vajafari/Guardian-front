import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <Card>
      <h1>{t('dashboard.welcome')}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{t('dashboard.description')}</p>
    </Card>
  );
}
