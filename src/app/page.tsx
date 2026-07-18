import WeatherApp from '@frontend/components/WeatherApp';

export default function Home() {
  return (
    <main className="min-h-screen font-sans" style={{ background: '#080810' }}>
      <div className="px-4 md:px-8 lg:px-10 max-w-7xl mx-auto flex flex-col min-h-screen">

        {/* Header */}
        <header className="text-center pt-10 md:pt-16 pb-8 md:pb-10">
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

        <div className="flex-1">
          <WeatherApp />
        </div>

        {/* Footer */}
        <footer className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-12 md:pb-16">
          <div className="p-6 md:p-10 rounded-2xl md:rounded-[2rem] bg-slate-900/60 border border-slate-800">
            <p className="text-indigo-400/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-2 md:mb-3">Developed By</p>
            <p className="font-bold text-indigo-300 text-lg md:text-xl mb-1">Tahir Hussain</p>
            <p className="text-sm leading-relaxed text-slate-400 font-medium">BSAI Student · Islamabad, Pakistan</p>
          </div>
          <div className="p-6 md:p-10 rounded-2xl md:rounded-[2rem] bg-slate-900/60 border border-slate-800">
            <p className="text-amber-400/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-2 md:mb-3">PM Accelerator</p>
            <p className="font-bold text-amber-300 text-base md:text-lg mb-2 md:mb-3">Product Manager Accelerator</p>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-3 md:mb-4 font-medium">
              Designed to support PM professionals through every stage of their careers — from entry-level to Directors — developing PM, AI and leadership skills.
            </p>
            <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-2 text-xs text-slate-500 border-t pt-3 md:pt-4 font-medium"
              style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
              <span><strong className="text-slate-300">Location:</strong> Boston, MA</span>
              <span><strong className="text-slate-300">Est.</strong> 2020</span>
              <span><a href="https://www.pmaccelerator.io/" target="_blank" rel="noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors">www.pmaccelerator.io</a></span>
              <span><strong className="text-slate-300">Phone:</strong> +1 (954) 889-1063</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
