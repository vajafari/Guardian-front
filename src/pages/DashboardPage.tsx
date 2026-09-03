import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SideMenu } from '../components/SideMenu';
import './DashboardPage.css';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="dashboard">
      <Header />
      <div className="dashboard__body">
        <main className="dashboard__main">
          <h1>{t('dashboard.welcome')}</h1>
          <p>{t('dashboard.description')}</p>
        </main>
        <SideMenu />
      </div>
      <Footer />
    </div>
  );
}
