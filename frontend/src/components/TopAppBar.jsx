export default function TopAppBar({ collapsed, title }) {
  return (
    <header
      className={`fixed top-0 right-0 h-24 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-12 z-40 transition-all duration-300 ${
        collapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-18rem)]'
      }`}
    >
      <div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-headline tracking-tight font-black text-blue-800 dark:text-blue-200">
          {title || 'Context-Lens'}
        </h2>
      </div>
      <div className="flex items-center gap-6">
        <button className="p-2 text-blue-700 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-3xl">
            notifications_active
          </span>
        </button>
        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-3xl text-blue-700">
            account_circle
          </span>
          <span className="font-bold text-on-surface hidden sm:inline">Hello, Grandma</span>
        </div>
      </div>
    </header>
  );
}
