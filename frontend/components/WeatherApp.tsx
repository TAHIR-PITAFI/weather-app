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
  const [visitorId, setVisitorId] = useState<string>("");
  const [historySearch, setHistorySearch] = useState("");
  const [compareList, setCompareList] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    let vid = localStorage.getItem("weather_visitor_id");
    if (!vid) {
      vid = "usr_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("weather_visitor_id", vid);
    }
    setVisitorId(vid);
  }, []);

  useEffect(() => {
    if (visitorId) {
      fetchHistory(visitorId);
    }
  }, [visitorId]);

  // Compute live search stats
  const totalSearches = history.length;
  const getStats = () => {
    if (history.length === 0) return { avgTemp: "–", favCity: "–" };
    let sumTemp = 0, validCount = 0;
    const cityCounts: { [key: string]: number } = {};

    history.forEach(r => {
      const name = r.resolvedLocationName || r.locationQuery;
      cityCounts[name] = (cityCounts[name] || 0) + 1;
      try {
        const payload = JSON.parse(r.temperatureData);
        const temp = payload.current?.temperature_2m ?? payload.daily?.temperature_2m_max?.[0];
        if (temp !== undefined && temp !== null) {
          sumTemp += temp;
          validCount++;
        }
      } catch {}
    });
    const avgTemp = validCount > 0 ? (sumTemp / validCount).toFixed(1) + "°C" : "–";
    let favCity = "–", maxCount = 0;
    Object.entries(cityCounts).forEach(([city, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favCity = city.split(',')[0];
      }
    });
    return { avgTemp, favCity };
  };
  const { avgTemp, favCity } = getStats();

  const filteredHistory = history.filter(r => {
    const q = historySearch.toLowerCase().trim();
    if (!q) return true;
    return (r.resolvedLocationName || "").toLowerCase().includes(q) || 
           (r.locationQuery || "").toLowerCase().includes(q) || 
           (r.notes || "").toLowerCase().includes(q);
  });

  const handleToggleCompare = (record: any) => {
    if (compareList.some(r => r.id === record.id)) {
      setCompareList(compareList.filter(r => r.id !== record.id));
    } else {
      if (compareList.length >= 2) {
        toast.error("You can only compare up to 2 cities!");
        return;
      }
      setCompareList([...compareList, record]);
    }
  };

  const fetchHistory = async (vid = visitorId) => {
    if (!vid) return;
    try {
      const res = await fetch(`/api/weather?visitorId=${vid}`);
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
        body: JSON.stringify({ location, resolvedName: geo.name, lat: geo.lat, lon: geo.lon, weatherPayload, startDate: startDate || null, endDate: endDate || null, visitorId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save weather data");
      setWeatherData(data);
      setLocation(""); setStartDate(""); setEndDate("");
      toast.success(`✓ Weather found for ${data.resolvedLocationName}`);
      fetchHistory(visitorId);
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
          body: JSON.stringify({ location: "Current GPS Location", resolvedName: "Current GPS Location", lat: latitude, lon: longitude, weatherPayload, visitorId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save");
        setWeatherData(data); setLocation("");
        toast.success("✓ Weather found for your current location"); fetchHistory(visitorId);
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

      {/* ── Compare Modal ── */}
      {isComparing && compareList.length === 2 && (() => {
        const p1 = JSON.parse(compareList[0].temperatureData);
        const p2 = JSON.parse(compareList[1].temperatureData);
        const t1 = p1.current?.temperature_2m ?? p1.daily?.temperature_2m_max?.[0] ?? "–";
        const t2 = p2.current?.temperature_2m ?? p2.daily?.temperature_2m_max?.[0] ?? "–";
        const fl1 = p1.current?.apparent_temperature ?? "–";
        const fl2 = p2.current?.apparent_temperature ?? "–";
        const h1 = p1.current?.relative_humidity_2m ?? "–";
        const h2 = p2.current?.relative_humidity_2m ?? "–";
        const w1 = p1.current?.wind_speed_10m ?? "–";
        const w2 = p2.current?.wind_speed_10m ?? "–";
        const code1 = p1.current?.weather_code ?? p1.daily?.weather_code?.[0] ?? 0;
        const code2 = p2.current?.weather_code ?? p2.daily?.weather_code?.[0] ?? 0;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#0D0D0D] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-white font-extrabold text-xl flex items-center gap-2">📊 Climate Comparison</h3>
                <button onClick={() => { setIsComparing(false); setCompareList([]); }} className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-lg">Close</button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                {/* City 1 */}
                <div className="space-y-4 text-center p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                  <h4 className="text-indigo-400 font-bold text-lg truncate">{compareList[0].resolvedLocationName.split(',')[0]}</h4>
                  <div className="flex justify-center">{getWeatherIcon(code1, "w-12 h-12")}</div>
                  <div className="text-4xl md:text-5xl font-black text-white">{t1}°C</div>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-800/60">Feels Like: <span className="text-slate-300 font-semibold">{fl1}°C</span></div>
                  <div className="text-xs text-slate-500">Humidity: <span className="text-slate-300 font-semibold">{h1}%</span></div>
                  <div className="text-xs text-slate-500">Wind: <span className="text-slate-300 font-semibold">{w1} km/h</span></div>
                </div>
                {/* City 2 */}
                <div className="space-y-4 text-center p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                  <h4 className="text-amber-400 font-bold text-lg truncate">{compareList[1].resolvedLocationName.split(',')[0]}</h4>
                  <div className="flex justify-center">{getWeatherIcon(code2, "w-12 h-12")}</div>
                  <div className="text-4xl md:text-5xl font-black text-white">{t2}°C</div>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-800/60">Feels Like: <span className="text-slate-300 font-semibold">{fl2}°C</span></div>
                  <div className="text-xs text-slate-500">Humidity: <span className="text-slate-300 font-semibold">{h2}%</span></div>
                  <div className="text-xs text-slate-500">Wind: <span className="text-slate-300 font-semibold">{w2} km/h</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Modal ── */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 bg-[#0D0D0D] border border-[#1E293B] rounded-2xl overflow-hidden p-2">
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
        <div className="space-y-4 md:space-y-6 w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Hero Card */}
            <div className="lg:col-span-3 relative rounded-2xl md:rounded-[2rem] overflow-hidden p-6 md:p-10 flex flex-col justify-between min-h-[200px] md:min-h-[280px] bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 shadow-xl shadow-indigo-950/10">
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
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#1a1208] to-[#271a06]/40 border border-amber-900/30 hover:border-amber-500/30 transition-all duration-300">
                <Thermometer className="w-5 h-5 text-amber-400" />
                <div className="mt-3"><p className="text-amber-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Feels Like</p>
                  <p className="text-2xl md:text-3xl font-semibold text-amber-100">{parsedWeather.current?.apparent_temperature ?? "–"}°</p></div>
              </div>
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#061712] to-[#0b2018]/40 border border-emerald-900/30 hover:border-emerald-500/30 transition-all duration-300">
                <Droplets className="w-5 h-5 text-emerald-400" />
                <div className="mt-3"><p className="text-emerald-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Humidity</p>
                  <p className="text-2xl md:text-3xl font-semibold text-emerald-100">{parsedWeather.current?.relative_humidity_2m ?? "–"}%</p></div>
              </div>
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#130b1f] to-[#1a0d2e]/40 border border-violet-900/30 hover:border-violet-500/30 transition-all duration-300">
                <Wind className="w-5 h-5 text-violet-400" />
                <div className="mt-3"><p className="text-violet-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Wind Speed</p>
                  <p className="text-2xl md:text-3xl font-semibold text-violet-100">{parsedWeather.current?.wind_speed_10m ?? "–"}<span className="text-sm font-normal text-violet-400/60 ml-1">km/h</span></p></div>
              </div>
              <div className="rounded-2xl md:rounded-[1.75rem] p-4 md:p-7 flex flex-col justify-between min-h-[110px] bg-gradient-to-br from-[#1c0a0e] to-[#260810]/40 border border-rose-900/30 hover:border-rose-500/30 transition-all duration-300">
                <Gauge className="w-5 h-5 text-rose-400" />
                <div className="mt-3"><p className="text-rose-400/60 text-[9px] font-bold tracking-widest uppercase mb-1">Pressure</p>
                  <p className="text-2xl md:text-3xl font-semibold text-rose-100">{parsedWeather.current?.surface_pressure ?? "–"}<span className="text-sm font-normal text-rose-400/60 ml-1">hPa</span></p></div>
              </div>
            </div>
          </div>

          {/* Row 2: Forecast + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="lg:col-span-3 rounded-2xl md:rounded-[2rem] p-5 md:p-10 bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 shadow-xl">
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
            <div className="lg:col-span-2 rounded-2xl md:rounded-[2rem] overflow-hidden h-[200px] md:h-[260px] border border-slate-800">
              <iframe width="100%" height="100%"
                style={{ border: 0 }}
                loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${weatherData.latitude},${weatherData.longitude}&z=11&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── History Section ── */}
      <section className="w-full max-w-5xl mx-auto pt-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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

        {/* ── Stats Widget ── */}
        {totalSearches > 0 && (
          <div className="grid grid-cols-3 gap-3 w-full p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="text-center">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Queries</p>
              <p className="text-base md:text-2xl font-extrabold text-indigo-400 mt-1">{totalSearches}</p>
            </div>
            <div className="text-center border-x border-slate-800/60">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">Avg Temp</p>
              <p className="text-base md:text-2xl font-extrabold text-amber-400 mt-1">{avgTemp}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">Fav City</p>
              <p className="text-base md:text-2xl font-extrabold text-emerald-400 mt-1 truncate px-1">{favCity}</p>
            </div>
          </div>
        )}

        {/* ── Interactive Live Filters ── */}
        {totalSearches > 0 && (
          <div className="flex flex-col md:flex-row gap-3 w-full bg-[#0B0D13]/60 p-3 rounded-2xl border border-slate-800">
            <input 
              type="text" 
              placeholder="🔍 Search history by city name or notes..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50"
            />
            {compareList.length > 0 && (
              <button 
                onClick={() => setIsComparing(true)}
                disabled={compareList.length !== 2}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                📊 Compare ({compareList.length}/2)
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {filteredHistory.map((record, idx) => (
            <div key={record.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-2xl border transition-all ${
                compareList.some(r => r.id === record.id) ? 'border-indigo-500 bg-indigo-950/10' : 'border-[#1A1A2E] bg-[#0D0D0D]'
              }`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button 
                  onClick={() => handleToggleCompare(record)}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold shrink-0 border transition-all ${
                    compareList.some(r => r.id === record.id) 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                  title="Click to compare side-by-side"
                >
                  {compareList.some(r => r.id === record.id) ? "✓" : "VS"}
                </button>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{record.resolvedLocationName}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{new Date(record.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  {record.startDate && <p className="text-amber-400/60 text-xs mt-0.5">📅 {record.startDate?.split('T')[0]} → {record.endDate?.split('T')[0]}</p>}
                </div>
                <div className="ml-auto sm:hidden flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(record)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-950/40 border border-indigo-900/40 text-indigo-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(record.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-950/40 border border-rose-900/40 text-rose-400">
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-950/40 border border-indigo-900/40 text-indigo-400">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(record.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-950/40 border border-rose-900/40 text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-800" style={{ background: '#0A0A0A' }}>
              <MapPin className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 font-medium text-center px-4">No history records match your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
