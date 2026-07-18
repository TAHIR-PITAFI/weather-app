import WeatherApp from '@frontend/components/WeatherApp';

export default function Home() {
  return (
    <main className="min-h-screen font-sans bg-[#080810] py-6 md:py-12"
      style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.06) 0%, transparent 40%), radial-gradient(circle at 100% 0%, rgba(56,189,248,0.05) 0%, transparent 40%), radial-gradient(circle at 50% 100%, rgba(245,158,11,0.04) 0%, transparent 40%)' }}>
      <div className="px-4 md:px-8 lg:px-10 max-w-7xl mx-auto">

        {/* Header */}
        <header className="text-center pb-8 md:pb-10">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8' }}>
            ✦ Real-Time Precision Forecasting
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-3 md:mb-4">
            Aero<span className="font-bold" style={{ background: 'linear-gradient(90deg, #818CF8, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Weather</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl mx-auto px-4">
            Advanced weather intelligence, beautifully visualised.
          </p>
        </header>

        <div>
          <WeatherApp />
        </div>

        {/* Footer */}
        <footer className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">
          {/* Dev Card */}
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-indigo-500/10 shadow-xl shadow-indigo-950/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase mb-4 bg-indigo-950/60 border border-indigo-900/40 text-indigo-400">
                👤 Developer Profile
              </div>
              <h3 className="font-extrabold text-white text-2xl tracking-tight mb-1">Tahir Hussain</h3>
              <p className="text-slate-400 text-sm font-medium mb-4">BSAI Student · AI Specialist in training</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-800/60 pt-4 mt-4">
              <span className="flex items-center gap-1 font-medium"><strong className="text-slate-400">Location:</strong> Islamabad, Pakistan</span>
            </div>
          </div>

          {/* PM Accelerator Card */}
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-amber-500/10 shadow-xl shadow-amber-950/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase mb-4 bg-amber-950/60 border border-amber-900/40 text-amber-400">
                🚀 Strategic Partner
              </div>
              <h3 className="font-extrabold text-white text-xl tracking-tight mb-2">Product Manager Accelerator</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 font-medium">
                Designed to support PM professionals through every stage of their careers — from entry-level to Directors — developing core PM, AI, and leadership capabilities.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 border-t border-slate-800/60 pt-4">
              <div><strong className="text-slate-400 block mb-0.5">Location</strong> Boston, MA</div>
              <div><strong className="text-slate-400 block mb-0.5">Established</strong> 2020</div>
              <div className="col-span-2 mt-1">
                <a href="https://www.pmaccelerator.io/" target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1">
                  🌐 Visit Website
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
