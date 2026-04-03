export default function Footer({ collapsed }) {
  return (
    <footer
      className={`fixed bottom-0 right-0 h-12 bg-blue-50 dark:bg-slate-900 flex justify-end items-center px-12 gap-8 z-40 transition-all duration-300 border-t border-blue-100/30 ${
        collapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-18rem)]'
      }`}
    >
      <div className="flex items-center gap-2 text-emerald-600 font-bold font-inter text-xs tracking-widest uppercase">
        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
        <span className="hidden sm:inline">Camera Active</span>
      </div>
      <div className="flex items-center gap-2 text-emerald-600 font-bold font-inter text-xs tracking-widest uppercase">
        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
        <span className="hidden sm:inline">Listening</span>
      </div>
      <div className="flex items-center gap-2 text-emerald-600 font-bold font-inter text-xs tracking-widest uppercase">
        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
        <span className="hidden sm:inline">Saving</span>
      </div>
      <div className="ml-4 border-l border-outline-variant/30 pl-4 hidden md:block">
        <span className="text-slate-400 font-bold font-inter text-[10px] tracking-tighter uppercase">
          System Status: Active
        </span>
      </div>
    </footer>
  );
}
