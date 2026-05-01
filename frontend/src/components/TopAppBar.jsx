export default function TopAppBar({ collapsed, title }) {
  return (
    <header
      className={`fixed top-0 right-0 h-20 bg-surface/90 dark:bg-slate-950/90 backdrop-blur-xl flex justify-between items-center px-8 z-40 transition-all duration-300 border-b border-outline-variant/20 ${
        collapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-16rem)]'
      }`}
    >
      <div>
        <h2 className="text-xl md:text-2xl font-headline tracking-tight font-extrabold text-on-surface dark:text-blue-200">
          {title || 'Context-Lens'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 text-primary hover:bg-surface-container-low transition-colors rounded-xl">
          <span className="material-symbols-outlined text-2xl">
            notifications_active
          </span>
        </button>
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-2xl text-primary">
            account_circle
          </span>
          <span className="font-bold text-sm text-on-surface hidden sm:inline">Hello, Grandma</span>
        </div>
      </div>
    </header>
  );
}
