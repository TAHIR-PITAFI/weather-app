export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
}

// Try Nominatim (OpenStreetMap) first — supports zip codes, landmarks, GPS, cities
// Falls back to Open-Meteo geocoding API if Nominatim returns nothing
export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  // Check if query looks like GPS coordinates (e.g. "33.6844, 73.0479")
  const coordMatch = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    return { name: `${lat}, ${lon}`, lat, lon };
  }

  // Try Nominatim first (handles zip codes, landmarks, streets, cities)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=en`;
    const res = await fetch(nominatimUrl, {
      headers: { 
        'User-Agent': 'AeroWeatherApp/1.0',
        'Accept-Language': 'en'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        const addr = place.address || {};
        const displayName = [
          addr.city || addr.town || addr.village || addr.county || place.display_name.split(',')[0],
          addr.state,
          addr.country
        ].filter(Boolean).join(', ');
        return {
          name: displayName,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
        };
      }
    }
  } catch (error) {
    console.error("Nominatim geocoding error", error);
  }

  // Fallback: Open-Meteo geocoding (good for city names)
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const first = data.results[0];
    return {
      name: `${first.name}${first.admin1 ? `, ${first.admin1}` : ''}${first.country ? `, ${first.country}` : ''}`,
      lat: first.latitude,
      lon: first.longitude,
    };
  } catch (error) {
    console.error("Open-Meteo geocoding fallback error", error);
    return null;
  }
}

export async function getWeatherData(lat: number, lon: number, startDate?: Date, endDate?: Date) {
  let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=auto`;
  
  if (startDate && endDate) {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    url += `&start_date=${startStr}&end_date=${endStr}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Weather API error", error);
    return null;
  }
}
