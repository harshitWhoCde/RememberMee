import { NavLink } from 'react-router-dom';
import logo from '../assets/rememberme-logo.svg';

export default function Sidebar({ collapsed, setCollapsed }) {
  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <aside
      className={`h-screen fixed left-0 top-0 border-r border-outline-variant/30 bg-surface-container-lowest/95 dark:bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col py-5 px-3 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
        }`}
      id="sidebar"
    >
      <div className={`mb-8 flex items-center ${collapsed ? 'px-0 justify-center' : 'px-4 gap-3 sidebar-header'}`}>
        <img src={logo} alt="RememberMe Logo" className={`object-contain bg-white rounded-full p-0.5 ${collapsed ? 'w-10 h-10 sidebar-icon-only' : 'w-10 h-10'}`} />
        {!collapsed && (
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface dark:text-blue-100 font-headline sidebar-header-text leading-tight">
              RememberMe
            </h1>
            <p className="text-[11px] font-semibold text-on-surface-variant font-label uppercase tracking-wider sidebar-header-text">
              Your Cognitive Sanctuary
            </p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-2">
        <NavLink
          to="/dashboard"
          replace
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-colors group ${isActive
              ? 'bg-primary-fixed text-on-primary-fixed-variant dark:bg-blue-900/40 dark:text-blue-100'
              : 'text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800'
            } ${collapsed ? 'justify-center !px-2' : ''}`
          }
        >
          <span className="material-symbols-outlined group-active:scale-95 duration-150 ease-in-out">
            home
          </span>
          {!collapsed && <span className="text-sm font-semibold font-inter sidebar-text">Living Room</span>}
        </NavLink>

        <NavLink
          to="visitors"
          replace
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-colors group ${isActive
              ? 'bg-primary-fixed text-on-primary-fixed-variant dark:bg-blue-900/40 dark:text-blue-100'
              : 'text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800'
            } ${collapsed ? 'justify-center !px-2' : ''}`
          }
        >
          <span className="material-symbols-outlined group-active:scale-95 duration-150 ease-in-out">
            history_edu
          </span>
          {!collapsed && <span className="text-sm font-semibold font-inter sidebar-text">Visitors & Memory</span>}
        </NavLink>

        <NavLink
          to="voice"
          replace
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-colors group ${isActive
              ? 'bg-primary-fixed text-on-primary-fixed-variant dark:bg-blue-900/40 dark:text-blue-100'
              : 'text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800'
            } ${collapsed ? 'justify-center !px-2' : ''}`
          }
        >
          <span className="material-symbols-outlined group-active:scale-95 duration-150 ease-in-out">
            settings_voice
          </span>
          {!collapsed && <span className="text-sm font-semibold font-inter sidebar-text">Voice Interface</span>}
        </NavLink>
      </nav>
      <div className="mt-auto space-y-3 px-1">
        {!collapsed && (
          <>
            <p className="text-primary text-sm font-bold font-inter mb-2">Need help?</p>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm transition-all active:scale-95">
              Contact Care
            </button>
          </>

        )}
        <div className="flex flex-col gap-1">
          <button
            onClick={toggleCollapse}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors rounded-xl text-on-surface-variant dark:text-slate-400 ${collapsed ? 'justify-center !px-2' : ''
              }`}
          >
            <span className="material-symbols-outlined">{collapsed ? 'menu' : 'menu_open'}</span>
            {!collapsed && <span className="font-semibold text-sm font-inter sidebar-text">Collapse Menu</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
