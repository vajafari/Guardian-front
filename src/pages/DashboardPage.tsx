import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SideMenu } from '../components/SideMenu';
import './DashboardPage.css';

export function DashboardPage() {
  return (
    <div className="dashboard">
      <Header />
      <div className="dashboard__body">
        <main className="dashboard__main">
          <h1>خوش آمدید</h1>
          <p>این صفحه داشبورد اصلی است.</p>
        </main>
        <SideMenu />
      </div>
      <Footer />
    </div>
  );
}
