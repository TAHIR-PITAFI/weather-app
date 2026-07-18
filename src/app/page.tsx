import WeatherApp from '@frontend/components/WeatherApp';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-clip font-sans"
      style={{ background: '#080810', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}>

      {/* Multi-color ambient glows */}
      <div className="absolute top-0 left-0 w-[300px] md:w-[600px] h-[250px] md:h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
      <div className="absolute top-0 right-0 w-[250px] md:w-[500px] h-[200px] md:h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/3 w-[300px] md:w-[700px] h-[200px] md:h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%)' }} />

      <div className="relative z-10 px-4 md:px-8 lg:px-10 max-w-7xl mx-auto flex flex-col min-h-screen">

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
          {/* Dev card — indigo */}
          <div className="p-6 md:p-10 rounded-2xl md:rounded-[2rem] transition-transform hover:-translate-y-1 duration-500"
            style={{ background: 'linear-gradient(135deg, #0D0D1F 0%, #12122E 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-indigo-400/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-2 md:mb-3">Developed By</p>
            <p className="font-bold text-indigo-300 text-lg md:text-xl mb-1">Tahir Hussain</p>
            <p className="text-sm leading-relaxed text-slate-400 font-medium">BSAI Student · Islamabad, Pakistan</p>
          </div>

          {/* PM Accelerator card — amber */}
          <div className="p-6 md:p-10 rounded-2xl md:rounded-[2rem] transition-transform hover:-translate-y-1 duration-500"
            style={{ background: 'linear-gradient(135deg, #1A1200 0%, #221800 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
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
