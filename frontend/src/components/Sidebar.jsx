import { NavLink } from 'react-router-dom';

export default function Sidebar({ collapsed, setCollapsed }) {
  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <aside
      className={`h-screen fixed left-0 top-0 border-r-0 bg-blue-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-blue-900/5 z-50 flex flex-col py-8 px-4 transition-all duration-300 ${
        collapsed ? 'w-[5rem]' : 'w-72'
      }`}
      id="sidebar"
    >
      <div className={`mb-12 ${collapsed ? 'px-0 flex justify-center' : 'px-6 sidebar-header'}`}>
        {!collapsed && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100 font-headline sidebar-header-text">
              Context-Lens
            </h1>
            <p className="text-sm font-medium text-slate-500 font-label mt-1 uppercase tracking-wider sidebar-header-text">
              Your Cognitive Sanctuary
            </p>
          </>
        )}
        {collapsed && (
          <span
            className="material-symbols-outlined text-blue-900 dark:text-blue-100 sidebar-icon-only"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lens
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-2">
        <NavLink
          to="/"
          replace
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-4 mb-2 rounded-full transition-colors group ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100'
                : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800'
            } ${collapsed ? 'justify-center !px-2' : ''}`
          }
        >
          <span className="material-symbols-outlined group-active:scale-95 duration-150 ease-in-out">
            home
          </span>
          {!collapsed && <span className="text-lg font-medium font-inter sidebar-text">Living Room</span>}
        </NavLink>

        <NavLink
          to="/visitors"
          replace
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-4 mb-2 rounded-full transition-colors group ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100'
                : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800'
            } ${collapsed ? 'justify-center !px-2' : ''}`
          }
        >
          <span className="material-symbols-outlined group-active:scale-95 duration-150 ease-in-out">
            history_edu
          </span>
          {!collapsed && <span className="text-lg font-medium font-inter sidebar-text">Visitors & Memory</span>}
        </NavLink>

        <NavLink
          to="/voice"
          replace
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-4 mb-2 rounded-full transition-colors group ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100'
                : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800'
            } ${collapsed ? 'justify-center !px-2' : ''}`
          }
        >
          <span className="material-symbols-outlined group-active:scale-95 duration-150 ease-in-out">
            settings_voice
          </span>
          {!collapsed && <span className="text-lg font-medium font-inter sidebar-text">Voice Interface</span>}
        </NavLink>
      </nav>
      <div className="mt-auto space-y-4 px-2">
        {!collapsed && (
          <div className="bg-primary/5 rounded-2xl p-4 mb-6 help-box">
            <p className="text-primary text-sm font-bold font-inter mb-2">Need help?</p>
            <button className="w-full py-3 bg-primary text-white rounded-full font-bold text-sm transition-all active:scale-95">
              Contact Care
            </button>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <button
            onClick={toggleCollapse}
            className={`flex items-center gap-4 px-6 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors rounded-full text-slate-500 dark:text-slate-400 ${
              collapsed ? 'justify-center !px-2' : ''
            }`}
          >
            <span className="material-symbols-outlined">{collapsed ? 'menu' : 'menu_open'}</span>
            {!collapsed && <span className="font-medium font-inter sidebar-text">Collapse Menu</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
