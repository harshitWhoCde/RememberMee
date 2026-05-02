import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopAppBar({ collapsed, title }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <header
      className={`fixed top-0 right-0 h-20 bg-surface/90 dark:bg-slate-950/90 backdrop-blur-xl flex justify-between items-center px-8 z-40 transition-all duration-300 border-b border-outline-variant/20 ${collapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-16rem)]'
        }`}
    >
      <div>
        <h2 className="text-xl md:text-2xl font-headline tracking-tight font-extrabold text-on-surface dark:text-blue-200">
          {title || 'RememberMe'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 text-primary hover:bg-surface-container-low transition-colors rounded-xl">
          <span className="material-symbols-outlined text-2xl">
            notifications_active
          </span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl text-primary">
              account_circle
            </span>
            <span className="font-bold text-sm text-on-surface hidden sm:inline">
              Hello, {userName}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              arrow_drop_down
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-outline-variant/20 z-50 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-error hover:bg-error-container hover:text-on-error-container dark:text-red-400 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
