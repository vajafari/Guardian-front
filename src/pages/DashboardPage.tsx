import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SideMenu } from '../components/SideMenu';
import { Card } from '../components/ui';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-svh flex flex-col bg-gray-100 dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex rtl:flex-row-reverse">
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Card>
            <h1>{t('dashboard.welcome')}</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t('dashboard.description')}
            </p>
          </Card>
        </main>
        <SideMenu />
      </div>
      <Footer />
    </div>
  );
}
