import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import Footer from './Footer';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  let title = 'RememberMe';
  if (location.pathname === '/') {
    title = 'Living Room Sanctuary';
  } else if (location.pathname === '/dashboard/visitors') {
    title = 'Visitors Archive';
  } else if (location.pathname === '/dashboard/voice') {
    title = 'Voice Interface (Coming Soon !!!)';
  } else if (location.pathname === '/dashboard/profile') {
    title = 'Profile';
  }

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <TopAppBar collapsed={collapsed} title={title} />

        <main className="flex-1 pt-28 pb-10 overflow-x-hidden">
          <Outlet />
        </main>

        {/* <Footer collapsed={collapsed} /> */}
      </div>
    </div>
  );
}
