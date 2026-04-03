import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';
import Footer from './Footer';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  let title = 'Context-Lens';
  if (location.pathname === '/') {
    title = 'Living Room Sanctuary';
  } else if (location.pathname === '/visitors') {
    title = 'Visitors Archive';
  } else if (location.pathname === '/voice') {
    title = 'Voice Interface';
  }

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-[5rem]' : 'ml-72'}`}>
        <TopAppBar collapsed={collapsed} title={title} />
        
        <main className="flex-1 pt-24 pb-12 overflow-x-hidden">
          <Outlet />
        </main>
        
        <Footer collapsed={collapsed} />
      </div>
    </div>
  );
}
