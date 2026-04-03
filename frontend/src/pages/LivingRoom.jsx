import Webcam from '../components/Webcam';

export default function LivingRoom() {
  return (
    <div className="px-12 h-full">
      <div className="grid grid-cols-10 gap-8 h-[calc(100vh-160px)]">
        {/* Left Column (65%) - Live Video Feed (Expanded) */}
        <section className="col-span-10 lg:col-span-6 xl:col-span-7 flex flex-col h-full">
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-surface-container-highest">
            <Webcam />
            {/* Camera Controls UI */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-full border border-white/20 z-20">
              <button className="p-3 text-white hover:bg-white/20 rounded-full transition-colors">
                <span className="material-symbols-outlined">videocam</span>
              </button>
              <button className="p-3 text-white hover:bg-white/20 rounded-full transition-colors">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="p-3 text-white hover:bg-white/20 rounded-full transition-colors">
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <button className="p-3 bg-red-600 text-white rounded-full transition-colors hover:bg-red-700">
                <span className="material-symbols-outlined">power_settings_new</span>
              </button>
            </div>
            {/* Live Indicator */}
            <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/50 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/10">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              <span className="text-sm font-bold tracking-widest uppercase">LIVE FEED</span>
              <div className="h-4 w-px bg-white/20 mx-1"></div>
              <span className="text-sm font-medium opacity-80">Camera - 2</span>
            </div>
          </div>
        </section>
        
        {/* Right Column (35%) - MemoryHUD & Transcript */}
        <section className="col-span-10 lg:col-span-4 xl:col-span-3 flex flex-col gap-6 h-full">
          {/* MemoryHUD Component */}
          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-blue-900/5 relative overflow-hidden border border-outline-variant/10 flex-shrink-0">
            <div className="relative z-10">
              <span className="inline-block bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase">
                Conversation
              </span>
              <h3 className="text-2xl font-headline font-extrabold text-blue-900 leading-tight mb-6">
                RAHUL (Son)
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <span className="material-symbols-outlined text-blue-700 text-xl">forum</span>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Previous Topic</p>
                    <p className="text-base font-medium text-on-surface leading-tight">Last talked about: Garden vegetables</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full flex-shrink-0">
                    <span className="material-symbols-outlined text-emerald-700 text-xl">health_and_safety</span>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Health Mention</p>
                    <p className="text-base font-medium text-on-surface leading-tight">Leg feeling better</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* TranscriptMonitor Component */}
          <div className="flex-1 bg-surface-container-low p-6 rounded-lg flex flex-col gap-4 border border-outline-variant/5 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">text_fields</span>
                <h4 className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Live Transcript</h4>
              </div>
              <span className="text-[10px] text-on-surface-variant italic">Syncing...</span>
            </div>
            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex gap-3 opacity-60">
                <span className="font-bold text-primary text-sm flex-shrink-0">Rahul:</span>
                <p className="text-sm">Hey Mom, how did that walk in the garden go this morning?</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-secondary text-sm flex-shrink-0">You:</span>
                <p className="text-sm italic font-medium">It was lovely, my leg didn't hurt as much as yesterday.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary text-sm flex-shrink-0">Rahul:</span>
                <p className="text-sm">That's great to hear! Did you manage to see the tomatoes yet?</p>
              </div>
              <div className="flex gap-3 animate-pulse">
                <span className="font-bold text-secondary text-sm flex-shrink-0">You:</span>
                <p className="text-sm bg-blue-100 rounded-lg px-2">I saw the...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
