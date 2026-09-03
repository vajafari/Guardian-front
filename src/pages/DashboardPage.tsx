import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SideMenu } from '../components/SideMenu';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-svh flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <main className="flex-1 p-8">
          <h1>{t('dashboard.welcome')}</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{t('dashboard.description')}</p>
        </main>
        <SideMenu />
      </div>
      <Footer />
    </div>
  );
}
