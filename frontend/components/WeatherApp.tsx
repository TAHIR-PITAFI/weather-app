"use client";

import { useState, useEffect } from "react";
import { MapPin, Calendar, Trash2, Edit2, Download, Cloud, Sun, CloudRain, Wind, CloudLightning, CloudSnow, Droplets, Thermometer, Gauge, Navigation, FileText, FileJson, Table2, BookOpen } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function WeatherApp() {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
      else throw new Error(data.error || "Failed to load history");
    } catch (e: any) { toast.error(e.message); setHistory([]); }
  };

  // ── Geocode in browser (avoids server-side network restrictions) ──
  const geocodeInBrowser = async (query: string): Promise<{ name: string; lat: number; lon: number } | null> => {
    const coordMatch = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordMatch) return { name: query, lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[2]) };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.length > 0) {
        const p = data[0]; const a = p.address || {};
        const name = [a.city || a.town || a.village || a.county || p.display_name.split(',')[0], a.state, a.country].filter(Boolean).join(', ');
        return { name, lat: parseFloat(p.lat), lon: parseFloat(p.lon) };
      }
    } catch { /* fallback */ }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
      const data = await res.json();
      if (data.results?.length > 0) {
        const r = data.results[0];
        return { name: `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}${r.country ? `, ${r.country}` : ''}`, lat: r.latitude, lon: r.longitude };
      }
    } catch { /* nothing */ }
    return null;
  };

  // ── Validate date range ──
  const validateDates = (): boolean => {
    if (startDate && endDate) {
      const s = new Date(startDate), e = new Date(endDate);
      if (s > e) { toast.error("Start date cannot be after end date"); return false; }
      const diffDays = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 92) { toast.error("Date range cannot exceed 92 days"); return false; }
    }
    return true;
  };

  // ── Search handler ──
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) { toast.error("Please enter a location"); return; }
    if (!validateDates()) return;
    setLoading(true);
    try {
      const geo = await geocodeInBrowser(location);
      if (!geo) throw new Error("Location not found. Try a different city name, zip code, or landmark.");

      let weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=auto`;
      if (startDate && endDate) {
        weatherUrl += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const weatherRes = await fetch(weatherUrl);
      let weatherPayload = await weatherRes.json();

      // If the forecast API rejects the date because it's too far in the past, fallback to the archive API
      if (weatherPayload.error && weatherPayload.reason?.includes("out of allowed range") && startDate && endDate) {
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${geo.lat}&longitude=${geo.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
        const archiveRes = await fetch(archiveUrl);
        weatherPayload = await archiveRes.json();
      }

      if (weatherPayload.error) {
        throw new Error(weatherPayload.reason || "Failed to fetch weather data from API");
      }

      // Save to DB via API
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, resolvedName: geo.name, lat: geo.lat, lon: geo.lon, weatherPayload, startDate: startDate || null, endDate: endDate || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save weather data");
      setWeatherData(data);
      setLocation(""); setStartDate(""); setEndDate("");
      toast.success(`✓ Weather found for ${data.resolvedLocationName}`);
      fetchHistory();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  // ── GPS handler ──
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported by this browser"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error("Failed to fetch weather data");
        const weatherPayload = await weatherRes.json();
        const res = await fetch('/api/weather', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: "Current GPS Location", resolvedName: "Current GPS Location", lat: latitude, lon: longitude, weatherPayload })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save");
        setWeatherData(data); setLocation("");
        toast.success("✓ Weather found for your current location"); fetchHistory();
      } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
    }, () => { toast.error("Unable to retrieve location. Check browser permissions."); setLoading(false); });
  };

  // ── CRUD: Delete ──
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/weather/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Record deleted"); fetchHistory();
      if (weatherData?.id === id) setWeatherData(null);
    } catch (e: any) { toast.error(e.message); }
  };

  // ── CRUD: Update (full edit modal) ──
  const openEdit = (record: any) => { setEditRecord(record); setEditNotes(record.notes || ""); };
  const handleUpdate = async () => {
    if (!editRecord) return;
    try {
      const res = await fetch(`/api/weather/${editRecord.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes })
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Record updated"); setEditRecord(null); fetchHistory();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Exports ──
  const exportJSON = () => {
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    a.download = "weather_history.json"; document.body.appendChild(a); a.click(); a.remove();
  };
  const exportCSV = () => {
    if (!history.length) { toast.error("No data to export"); return; }
    const rows = [["ID","Location","Resolved Name","Lat","Lon","Start Date","End Date","Created At","Notes"],
      ...history.map(r => [r.id, `"${r.locationQuery}"`, `"${r.resolvedLocationName}"`, r.latitude, r.longitude, r.startDate||"", r.endDate||"", r.createdAt, `"${r.notes||""}"`])];
    const a = document.createElement('a');
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));
    a.download = "weather_history.csv"; document.body.appendChild(a); a.click(); a.remove();
  };
  const exportXML = () => {
    if (!history.length) { toast.error("No data to export"); return; }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<WeatherHistory>\n${history.map(r=>`  <Record>\n    <ID>${r.id}</ID>\n    <Location>${r.locationQuery}</Location>\n    <ResolvedName>${r.resolvedLocationName}</ResolvedName>\n    <Latitude>${r.latitude}</Latitude>\n    <Longitude>${r.longitude}</Longitude>\n    <CreatedAt>${r.createdAt}</CreatedAt>\n    <Notes>${r.notes||""}</Notes>\n  </Record>`).join("\n")}\n</WeatherHistory>`;
    const a = document.createElement('a');
    a.href = "data:text/xml;charset=utf-8," + encodeURIComponent(xml);
    a.download = "weather_history.xml"; document.body.appendChild(a); a.click(); a.remove();
  };
  const exportMarkdown = () => {
    if (!history.length) { toast.error("No data to export"); return; }
    const md = `# Weather Search History\n\n| # | Location | Lat | Lon | Date | Notes |\n|---|---|---|---|---|---|\n${history.map((r,i)=>`| ${i+1} | ${r.resolvedLocationName} | ${r.latitude} | ${r.longitude} | ${new Date(r.createdAt).toLocaleDateString()} | ${r.notes||"-"} |`).join("\n")}`;
    const a = document.createElement('a');
    a.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    a.download = "weather_history.md"; document.body.appendChild(a); a.click(); a.remove();
  };

  const getWeatherIcon = (code: number, cls = "w-10 h-10") => {
    if (code <= 3) return <Sun className={`${cls} text-amber-400`} />;
    if (code <= 48) return <Cloud className={`${cls} text-slate-400`} />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain className={`${cls} text-sky-400`} />;
    if (code <= 77 || code >= 85) return <CloudSnow className={`${cls} text-blue-200`} />;
    if (code >= 95) return <CloudLightning className={`${cls} text-violet-400`} />;
    return <Sun className={`${cls} text-amber-400`} />;
  };

  const parsedWeather = weatherData ? JSON.parse(weatherData.temperatureData) : null;

  return (
    <div className="space-y-10 md:space-y-14 pb-10">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0D0D0D', color: '#F1F5F9', border: '1px solid #1E293B', borderRadius: '16px', padding: '14px 20px', fontWeight: 500, fontSize: '14px' }
      }} />

      {/* ── Edit Modal ── */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#0D0D0D', border: '1px solid #1E293B' }}>
            <h3 className="text-white font-bold text-xl">Edit Record</h3>
            <div className="space-y-1">
              <p className="text-slate-400 text-sm font-medium">Location</p>
              <p className="text-white font-semibold">{editRecord.resolvedLocationName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 text-sm font-medium">Date Searched</p>
              <p className="text-slate-300 text-sm">{new Date(editRecord.createdAt).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-sm font-medium block">Custom Notes</label>
              <textarea
                value={editNotes} onChange={e => setEditNotes(e.target.value)}
                rows={3} placeholder="Add your custom notes here..."
                className="w-full bg-[#111] border border-[#1E293B] rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleUpdate} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors">Save Changes</button>
              <button onClick={() => setEditRecord(null)} className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800 py-3 rounded-xl font-semibold transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Bar + Date Range ── */}
      <section className="w-full max-w-2xl mx-auto space-y-3">
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Location input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 bg-[#0D0D0D] border border-[#1E293B] hover:border-indigo-500/40 focus-within:border-indigo-500/60 rounded-2xl overflow-hidden p-2 transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.15)]">
            <div className="flex items-center flex-1 min-w-0">
              <div className="pl-3 text-indigo-400 shrink-0"><MapPin className="w-5 h-5" /></div>
              <input
                type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Enter city, zip code, GPS coords, landmark..."
                className="flex-1 min-w-0 bg-transparent border-none py-3.5 px-3 text-slate-100 placeholder:text-slate-600 focus:outline-none text-sm md:text-base font-medium"
              />
              <button type="button" onClick={handleCurrentLocation} title="Use my current GPS location"
                className="p-3 mr-1 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/40 transition-all shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-6 md:px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-900/30 disabled:opacity-40 text-sm md:text-base min-h-[48px] w-full sm:w-auto">
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {/* Optional Date Range */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#0D0D0D] border border-[#1E293B] rounded-xl px-4 py-2.5">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1">
                <label className="text-amber-400/60 text-[9px] font-bold tracking-widest uppercase block">Start Date (optional)</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-slate-300 text-sm font-medium focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[#0D0D0D] border border-[#1E293B] rounded-xl px-4 py-2.5">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1">
                <label className="text-amber-400/60 text-[9px] font-bold tracking-widest uppercase block">End Date (optional)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-slate-300 text-sm font-medium focus:outline-none" />
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* ── Weather Dashboard ── */}
      {parsedWeather && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-4 md:space-y-6 w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Hero Card */}
            <div className="lg:col-span-3 relative rounded-2xl md:rounded-[2rem] overflow-hidden p-6 md:p-10 flex flex-col justify-between min-h-[200px] md:min-h-[280px]"
              style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0C1A2E 60%, #0A2540 100%)', border: '1px solid rgba(56,189,248,0.12)' }}>
              <div className="absolute top-0 right-0 w-40 md:w-56 h-40 md:h-56 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sky-400/70 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-1 md:mb-2 truncate">Current Conditions</p>
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight break-words line-clamp-2">{weatherData.resolvedLocationName}</h2>
                  {weatherData.startDate && <p className="text-sky-300/50 text-xs mt-1 truncate">📅 {weatherData.startDate?.split('T')[0]} → {weatherData.endDate?.split('T')[0]}</p>}
                </div>
                {getWeatherIcon(parsedWeather.current?.weather_code ?? parsedWeather.daily?.weather_code?.[0] ?? 0, "w-12 h-12 md:w-16 md:h-16 drop-shadow-lg")}
              </div>
              <div className="relative z-10 mt-6 md:mt-14">
                <span className="text-7xl md:text-[7rem] font-thin text-white leading-none tracking-tighter">
                  {parsedWeather.current?.temperature_2m ?? parsedWeather.daily?.temperature_2m_max?.[0] ?? "–"}°
                </span>
                <span className="block text-sky-300/60 font-medium mt-1 md:mt-2 text-xs md:text-sm">Temperature in Celsius</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-5">
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px]"
                style={{ background: 'linear-gradient(145deg, #1C1208 0%, #271A06 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Thermometer className="w-5 h-5 text-amber-400" />
                <div className="mt-3"><p className="text-amber-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Feels Like</p>
                  <p className="text-2xl md:text-3xl font-semibold text-amber-100">{parsedWeather.current?.apparent_temperature ?? "–"}°</p></div>
              </div>
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px]"
                style={{ background: 'linear-gradient(145deg, #061712 0%, #0B2018 100%)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <Droplets className="w-5 h-5 text-emerald-400" />
                <div className="mt-3"><p className="text-emerald-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Humidity</p>
                  <p className="text-2xl md:text-3xl font-semibold text-emerald-100">{parsedWeather.current?.relative_humidity_2m ?? "–"}%</p></div>
              </div>
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px]"
                style={{ background: 'linear-gradient(145deg, #130B1F 0%, #1A0D2E 100%)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <Wind className="w-5 h-5 text-violet-400" />
                <div className="mt-3"><p className="text-violet-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Wind Speed</p>
                  <p className="text-2xl md:text-3xl font-semibold text-violet-100">{parsedWeather.current?.wind_speed_10m ?? "–"}<span className="text-sm font-normal text-violet-400/60 ml-1">km/h</span></p></div>
              </div>
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px]"
                style={{ background: 'linear-gradient(145deg, #1C0A0E 0%, #260810 100%)', border: '1px solid rgba(251,113,133,0.2)' }}>
                <Gauge className="w-5 h-5 text-rose-400" />
                <div className="mt-3"><p className="text-rose-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Pressure</p>
                  <p className="text-2xl md:text-3xl font-semibold text-rose-100">{parsedWeather.current?.surface_pressure ?? "–"}<span className="text-sm font-normal text-rose-400/60 ml-1">hPa</span></p></div>
              </div>
            </div>
          </div>

          {/* Row 2: Forecast + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="lg:col-span-3 rounded-2xl md:rounded-[2rem] p-5 md:p-10"
              style={{ background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)', border: '1px solid rgba(255,215,0,0.08)' }}>
              <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-amber-400/70 mb-5 md:mb-8 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> 5-Day Forecast
              </p>
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 md:justify-between">
                {parsedWeather.daily?.time?.slice(0, 5).map((time: string, i: number) => (
                  <div key={time} className="flex flex-col items-center flex-shrink-0 md:flex-1 gap-2 min-w-[56px]">
                    <p className="text-slate-400 text-xs font-semibold whitespace-nowrap">{new Date(time).toLocaleDateString('en-US', { weekday: 'short', month:'short', day:'numeric' })}</p>
                    {getWeatherIcon(parsedWeather.daily.weather_code[i], "w-7 h-7 md:w-9 md:h-9")}
                    <p className="text-white font-bold text-base md:text-lg">{parsedWeather.daily.temperature_2m_max[i]}°</p>
                    <p className="text-slate-500 text-xs font-medium">{parsedWeather.daily.temperature_2m_min[i]}°</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 rounded-2xl md:rounded-[2rem] overflow-hidden relative h-[200px] md:min-h-[260px]"
              style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="absolute inset-0 bg-indigo-950/20 pointer-events-none z-10" />
              <iframe width="100%" height="100%"
                style={{ border: 0, position: 'absolute', inset: 0, filter: 'invert(92%) hue-rotate(185deg) saturate(0.8) contrast(1.1)' }}
                loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${weatherData.latitude},${weatherData.longitude}&z=11&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── History Section ── */}
      <section className="w-full max-w-5xl mx-auto pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 gap-4">
          <div>
            <p className="text-indigo-400/70 text-[10px] font-bold tracking-[0.25em] uppercase mb-1">Database · CRUD</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white">Search History</h3>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Create, Read, Update & Delete your weather records.</p>
          </div>
          {/* Export buttons — all 4 formats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            <button onClick={exportJSON} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-emerald-300 text-xs font-bold hover:bg-emerald-900/30 transition-colors min-h-[40px]">
              <FileJson className="w-3.5 h-3.5" /> JSON
            </button>
            <button onClick={exportCSV} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-amber-900/40 bg-amber-950/20 text-amber-300 text-xs font-bold hover:bg-amber-900/30 transition-colors min-h-[40px]">
              <Table2 className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={exportXML} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-sky-900/40 bg-sky-950/20 text-sky-300 text-xs font-bold hover:bg-sky-900/30 transition-colors min-h-[40px]">
              <FileText className="w-3.5 h-3.5" /> XML
            </button>
            <button onClick={exportMarkdown} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-violet-900/40 bg-violet-950/20 text-violet-300 text-xs font-bold hover:bg-violet-900/30 transition-colors min-h-[40px]">
              <BookOpen className="w-3.5 h-3.5" /> MD
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {history.map((record, idx) => (
            <div key={record.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-2xl group transition-all"
              style={{ background: '#0D0D0D', border: '1px solid #1A1A2E' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D2D4E')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A1A2E')}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)', color: '#A5B4FC' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{record.resolvedLocationName}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{new Date(record.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  {record.startDate && <p className="text-amber-400/60 text-xs mt-0.5">📅 {record.startDate?.split('T')[0]} → {record.endDate?.split('T')[0]}</p>}
                </div>
                <div className="ml-auto sm:hidden flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(record)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(record.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-950/40 border border-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="sm:flex-1 sm:max-w-[220px] px-4 py-3 rounded-xl relative min-w-0 overflow-hidden"
                style={{ background: '#111', border: '1px solid #1E293B' }}>
                {record.notes ? <p className="text-slate-300 text-sm pr-6 truncate">{record.notes}</p>
                  : <p className="text-slate-600 text-sm italic">No notes added</p>}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => openEdit(record)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(record.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-950/40 border border-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-800" style={{ background: '#0A0A0A' }}>
              <MapPin className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 font-medium text-center px-4">No history yet. Search for a city above to get started!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
