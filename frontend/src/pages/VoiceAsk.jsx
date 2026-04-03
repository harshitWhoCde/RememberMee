export default function VoiceAsk() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl w-full px-12 py-12 flex flex-col items-center text-center space-y-16">
        {/* VoicePromptButton */}
        <div className="relative group cursor-pointer mt-8">
          <div className="voice-pulse absolute inset-0 bg-primary/20 rounded-full"></div>
          <button className="relative z-10 w-64 h-64 rounded-full bg-gradient-to-br from-primary to-primary-container flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-90 duration-300">
            <span
              className="material-symbols-outlined text-white text-7xl mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mic
            </span>
            <span className="text-white font-headline font-bold text-xl tracking-widest">
              TAP TO ASK
            </span>
          </button>
        </div>
        
        {/* QuestionDisplay */}
        <div className="space-y-4">
          <p className="text-on-surface-variant font-label text-xl">You asked:</p>
          <h3 className="text-4xl font-headline font-bold text-on-surface">
            "Who visited yesterday?"
          </h3>
        </div>
        
        {/* Result Area: AIAnswerCard */}
        <div className="w-full max-w-2xl bg-surface-container-lowest/80 backdrop-blur-3xl rounded-xl p-10 shadow-2xl shadow-primary/5 border border-outline-variant/10 relative overflow-hidden">
          {/* Subtle outer glow */}
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="relative flex flex-col items-center space-y-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <span
                className="material-symbols-outlined text-primary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <p className="text-3xl font-headline font-semibold text-on-surface leading-relaxed">
              Your son <span className="text-primary font-bold">Rahul</span> visited yesterday afternoon.
            </p>
            <div className="flex gap-4 pt-4">
              <span className="px-6 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold uppercase tracking-wider">
                Memory Anchored
              </span>
              <span className="px-6 py-2 bg-surface-container text-on-surface-variant rounded-full text-sm font-medium">
                3:14 PM
              </span>
            </div>
          </div>
          {/* Subtle texture image in background */}
          <div className="absolute -bottom-24 -right-24 opacity-10">
            <img
              className="w-64 h-64 rounded-full blur-3xl"
              alt="background gradient"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTs9nVjw6rfSDBptk5FJMrDc5ZAFQoJMboIvf_HMZez5Ziz3gkOG72BnboPeAkg5KXZahPPYAHUqfQRFE0mJoUqXMYNrm-ug-Ug3_vhNR-Xh_3464Wfp8OkCNX9S1X16x88zM8x9WHrnvmW1zjtMI5MPOZ-AFqho9IIecmPQfXbmqLKry_G5NpBGLsPlVDNqz1YVmMr-FUicyMCANr5I26tCZhirA4K0xhO3sG2Jw1ZJnvbUbclYs2AEvRA21HMM38pztsIA-Csuu5"
            />
          </div>
        </div>
        
        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant rounded-full text-lg font-medium transition-colors">
            When is lunch?
          </button>
          <button className="px-8 py-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant rounded-full text-lg font-medium transition-colors">
            Where are my keys?
          </button>
          <button className="px-8 py-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant rounded-full text-lg font-medium transition-colors">
            Call Rahul
          </button>
        </div>
      </div>
    </div>
  );
}
