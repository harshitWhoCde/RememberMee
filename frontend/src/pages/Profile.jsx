import { useLocation } from "react-router-dom";

export default function Profile() {
  const location = useLocation();
  const { name, notes } = location.state || {};

  return (
    <div className="px-12 py-8 max-w-4xl mx-auto">
      <div className="bg-surface-container-lowest rounded-xl p-10 shadow-2xl shadow-blue-900/5 border border-outline-variant/10 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          {/* Avatar / Icon Placeholder */}
          <div className="w-48 h-48 rounded-full bg-primary-container/20 flex items-center justify-center border-4 border-primary/10 shadow-inner">
            <span className="material-symbols-outlined text-primary text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_circle
            </span>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <span className="inline-block px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-2">
                Recognized Visitor
              </span>
              <h1 className="text-5xl font-headline font-black text-blue-900 leading-tight">
                {name || "Guest"}
              </h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/5">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  description
                </span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Memory Notes</p>
                  <p className="text-xl text-on-surface leading-relaxed">
                    {notes || "No specific memories recorded yet. You can add them in the archive."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <p className="text-emerald-800 font-medium">Memory Anchored Successfully</p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
              <button className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
                Edit Details
              </button>
              <button 
                onClick={() => window.history.back()}
                className="px-8 py-3 bg-surface-container-high text-on-surface-variant rounded-full font-bold transition-all hover:bg-surface-container-highest active:scale-95"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Info / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Last Seen</p>
          <p className="text-2xl font-headline font-bold text-blue-900">Today, 3:14 PM</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Frequency</p>
          <p className="text-2xl font-headline font-bold text-blue-900">3 visits / week</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Relationship</p>
          <p className="text-2xl font-headline font-bold text-blue-900">Trusted Guest</p>
        </div>
      </div>
    </div>
  );
}
