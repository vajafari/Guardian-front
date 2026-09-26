import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { SideMenu } from './SideMenu';

export function DashboardLayout() {
  return (
    <div className="min-h-svh flex flex-col bg-gray-100 dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex rtl:flex-row-reverse">
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">
          <Outlet />
        </main>
        <SideMenu />
      </div>
      <Footer />
    </div>
  );
}
