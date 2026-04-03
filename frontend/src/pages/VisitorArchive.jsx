export default function VisitorArchive() {
  return (
    <div className="px-12 flex gap-12 min-h-full">
      {/* Left Column: VisitorDirectory (40%) */}
      <section className="w-2/5 space-y-8">
        <h3 className="text-2xl font-bold font-headline text-on-surface-variant px-2">Recent Visitors</h3>
        <div className="space-y-4">
          {/* Active Card */}
          <div className="bg-surface-container-lowest p-6 rounded-lg flex items-center gap-6 shadow-xl shadow-blue-900/5 ring-4 ring-primary/10">
            <img
              alt="Rahul Profile"
              className="w-20 h-20 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiPgwAdV8oeFLXr69ctYvssUtV2x4PF0psAkkXULFLUZSj3fuZcC8gGo0uyGW4SkxISFoCb8KbGNxPAHRYyGFlbk8NaCt1luTkJtrAZ0CEupVzqEGSLzWypQEwO-c1OphGswxdVGaq7DOYlsatT_YH28eev4Nc7uCNDHeLAIDZx_RGXAUED5HtqXpr1t7GYIxg6yFXoOFoYLDoCT0AB2oe_QsT914-qX300MCfapy8WMKH8N4yHHehMv_raY73kQAKCK-Vj53G0Jlr"
            />
            <div>
              <p className="text-2xl font-bold text-on-surface">Rahul</p>
              <p className="text-primary font-medium text-lg">Son</p>
            </div>
            <div className="ml-auto">
              <span className="material-symbols-outlined text-primary text-3xl">chevron_right</span>
            </div>
          </div>
          {/* Inactive Cards */}
          <div className="bg-surface-container-low p-6 rounded-lg flex items-center gap-6 hover:bg-surface-container transition-colors cursor-pointer">
            <img
              alt="Elena Profile"
              className="w-20 h-20 rounded-full object-cover grayscale opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh3XWKwunDGZPjOlN1SOCudF-IUn5UyVTeWf0MBVVWCa_voy5Z-v_TMpKGq_UsNG3WfQkw41aBTFhJpimWAaZUxW2uW7xeY9NIL2QEYYxVaKKU8nCeDptVM8DvmcE8BQgHqQDUpyngZYc7IL7JNR3-6D8ADhavUH3ZSBdtRC94qIkeZJz-_TtwGdloAfxo3I6P9RZt-xP9OIEvQ-MOwH8TbraF2BYfh4EmF26D39f5Fgy2SdIaAgPhTM-0QpNi5WItIKaAn7WZTbBW"
            />
            <div>
              <p className="text-2xl font-bold text-on-surface opacity-80">Elena</p>
              <p className="text-on-surface-variant font-medium text-lg">Caregiver</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg flex items-center gap-6 hover:bg-surface-container transition-colors cursor-pointer">
            <img
              alt="Mark Profile"
              className="w-20 h-20 rounded-full object-cover grayscale opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs7HMQpaQ7e25B99I8oCYa3baRtKiGp1L_-EQg_zzNIzc1X43AkHqh-O8WuXp2yxiw95OPjqrxAIfc4z3Q7GKh1kEiZKx8-RTLJkp6k4Vpo03KvpetMw9CmqF2WtsUwlunOeN_9eQwq-0Er8s9G2rRNP1mjYWcEJohLCDN9cyZM7TcWIBoS0MyKPv7g0qRNb0WTTRHSt6pgf9gb9i0c-2bvC1qU_kgFC43mFDy9RZ5Rc4wCSwa8L7mt89Py1kA0hfC-AD9mL52Be1h"
            />
            <div>
              <p className="text-2xl font-bold text-on-surface opacity-80">Mark</p>
              <p className="text-on-surface-variant font-medium text-lg">Neighbor</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg flex items-center gap-6 hover:bg-surface-container transition-colors cursor-pointer">
            <img
              alt="Sarah Profile"
              className="w-20 h-20 rounded-full object-cover grayscale opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCK4eKfaSAlgpSYY9kV1SY9Asty-2pnWUk5zen4Ev417d91ZCz9f46uPCx_sL8cLOLv-2xVMcGIjZItrXlyCf2LDZJ06OGClpxq9dDbysGS-8WEvA9MdeGjXJYEeSaZMzXtC_RWzySuBe_lAWG2hn5xsioU6RHhwIBsAayDQN50wlMd6pmKODQYuBe-VBC0FX56Lf302J4SltOr151H3pX8s6vORo3pXzhRQgoI_fgUsvBYRZ1J-DvK3o1pkjGmgyKNrsF5b2yI4Twv"
            />
            <div>
              <p className="text-2xl font-bold text-on-surface opacity-80">Sarah</p>
              <p className="text-on-surface-variant font-medium text-lg">Granddaughter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: MemoryTimeline (60%) */}
      <section className="w-3/5">
        <div className="bg-surface-container-lowest p-10 rounded-lg shadow-xl shadow-blue-900/5 min-h-[716px]">
          <h3 className="text-3xl font-bold font-headline text-primary mb-12">Conversations with Rahul</h3>
          <div className="relative space-y-12">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-1 bg-surface-container-highest rounded-full"></div>
            
            {/* Timeline Item 1 */}
            <div className="relative pl-12">
              <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-primary ring-4 ring-white shadow-sm z-10"></div>
              <div className="space-y-2">
                <time className="text-xl font-bold text-on-surface">March 15, 2026</time>
                <div className="bg-surface p-6 rounded-lg border-l-8 border-primary-container">
                  <p className="text-xl leading-relaxed text-on-surface-variant">
                    "Discussed soccer practice; promised to bring some tea next time. Rahul mentioned his new promotion at work."
                  </p>
                </div>
              </div>
            </div>
            
            {/* Timeline Item 2 */}
            <div className="relative pl-12">
              <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-outline-variant ring-4 ring-white shadow-sm z-10"></div>
              <div className="space-y-2">
                <time className="text-xl font-bold text-on-surface">March 12, 2026</time>
                <div className="bg-surface p-6 rounded-lg opacity-80">
                  <p className="text-xl leading-relaxed text-on-surface-variant">
                    "Talked about the garden. We looked at old photo albums from the summer of 1998. Rahul helped water the hydrangeas."
                  </p>
                </div>
              </div>
            </div>
            
            {/* Timeline Item 3 */}
            <div className="relative pl-12">
              <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-outline-variant ring-4 ring-white shadow-sm z-10"></div>
              <div className="space-y-2">
                <time className="text-xl font-bold text-on-surface">March 05, 2026</time>
                <div className="bg-surface p-6 rounded-lg opacity-80">
                  <p className="text-xl leading-relaxed text-on-surface-variant">
                    "Brief check-in before his flight. Reminded me to take my evening vitamins. Rahul looked tired but happy."
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Load More */}
          <div className="mt-12 flex justify-center">
            <button className="px-8 py-4 text-primary font-bold text-lg hover:bg-primary/5 rounded-full transition-colors">
              View older memories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
