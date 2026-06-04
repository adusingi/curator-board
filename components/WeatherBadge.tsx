"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherPayload } from "@/app/api/weather/route";
import type { CountryItem, SearchResult } from "@/app/api/location/route";

const LOCATION_KEY = "curator-board-location";
const POLL_MS = 30 * 60 * 1000;
const TICK_MS = 30_000;

type SavedLocation = { lat: number; lon: number; city: string };

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function readSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch { return null; }
}

function saveLocation(loc: SavedLocation) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
}

async function fetchWeather(lat?: number, lon?: number): Promise<WeatherPayload | null> {
  try {
    const q = lat != null && lon != null ? `?lat=${lat}&lon=${lon}` : "";
    const res = await fetch(`/api/weather${q}`);
    return res.ok ? ((await res.json()) as WeatherPayload) : null;
  } catch { return null; }
}

function requestGeo(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      () => resolve(null),
      { timeout: 8_000 },
    );
  });
}

// ─── Location Picker ─────────────────────────────────────────────────────────

type PickerProps = { onClose: () => void; onApply: (loc: SavedLocation) => void };

function LocationPicker({ onClose, onApply }: PickerProps) {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [country, setCountry] = useState<CountryItem | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [chosen, setChosen] = useState<SearchResult | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/location?type=countries")
      .then((r) => r.json())
      .then((d: CountryItem[]) => setCountries(d))
      .catch(() => setError("Could not load countries."));
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    setChosen(null);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2 || !country) return;

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `/api/location?type=search&query=${encodeURIComponent(value)}&iso2=${country.iso2}`,
        );
        const data: SearchResult[] = await res.json();
        setSuggestions(data);
      } catch {
        // silent — suggestions are non-critical
      } finally {
        setLoadingSuggestions(false);
      }
    }, 320);
  }

  function pickSuggestion(s: SearchResult) {
    setChosen(s);
    setQuery(`${s.name}${s.admin1 ? `, ${s.admin1}` : ""}`);
    setSuggestions([]);
    setGeoStatus("idle");
  }

  async function useGPS() {
    setGeoStatus("asking");
    setError(null);
    const coords = await requestGeo();
    if (coords) {
      setGeoStatus("granted");
      onApply({ lat: coords.latitude, lon: coords.longitude, city: chosen?.name ?? "" });
    } else {
      setGeoStatus("denied");
    }
  }

  async function useCityCoords() {
    if (!chosen) return;
    setApplying(true);
    onApply({ lat: chosen.lat, lon: chosen.lon, city: chosen.name });
  }

  async function useGeoOnly() {
    setGeoStatus("asking");
    setError(null);
    const coords = await requestGeo();
    if (coords) {
      setGeoStatus("granted");
      const weather = await fetchWeather(coords.latitude, coords.longitude);
      onApply({
        lat: coords.latitude,
        lon: coords.longitude,
        city: weather?.city ?? "",
      });
    } else {
      setGeoStatus("denied");
      setError("Location access denied. Search for a city instead.");
    }
  }

  const showConfirm = chosen !== null;

  return (
    <div className="location-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="location-panel">

        <div className="location-header">
          <span className="location-title">set location</span>
          <button className="location-close" onClick={onClose}>esc</button>
        </div>

        <div className="location-body">
          {error && <p className="location-error">{error}</p>}

          {/* GPS shortcut */}
          {!showConfirm && (
            <button
              className="location-geo-btn"
              onClick={useGeoOnly}
              disabled={geoStatus === "asking"}
            >
              {geoStatus === "asking" ? "requesting…" : "⊙ use my current location"}
            </button>
          )}

          {!showConfirm && <div className="location-divider"><span>or search</span></div>}

          {/* Country + city search */}
          {!showConfirm && (
            <>
              <label className="location-label">country</label>
              <select
                className="location-select"
                value={country?.name ?? ""}
                onChange={(e) => {
                  const found = countries.find((c) => c.name === e.target.value) ?? null;
                  setCountry(found);
                  setQuery("");
                  setSuggestions([]);
                }}
              >
                <option value="">select country</option>
                {countries.map((c) => (
                  <option key={c.iso2} value={c.name}>{c.name}</option>
                ))}
              </select>

              <label className="location-label">city or prefecture</label>
              <div className="location-search-wrap">
                <input
                  className="location-input"
                  type="text"
                  placeholder={country ? "type to search…" : "select a country first"}
                  disabled={!country}
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  autoComplete="off"
                />
                {loadingSuggestions && <span className="location-spinner">…</span>}
                {suggestions.length > 0 && (
                  <ul className="location-suggestions">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button className="location-suggestion" onClick={() => pickSuggestion(s)}>
                          <span className="suggestion-name">{s.name}</span>
                          {s.admin1 && <span className="suggestion-admin">{s.admin1}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* Confirm step: GPS vs city coords */}
          {showConfirm && chosen && (
            <div className="location-confirm">
              <p className="location-confirm-label">selected</p>
              <p className="location-confirm-city">
                {chosen.name}{chosen.admin1 ? `, ${chosen.admin1}` : ""}
              </p>
              <p className="location-confirm-hint">
                Allow GPS for your exact position, or use the city coordinates.
              </p>
              <div className="location-confirm-actions">
                <button
                  className="location-geo-btn"
                  onClick={useGPS}
                  disabled={geoStatus === "asking" || geoStatus === "granted"}
                >
                  {geoStatus === "asking" ? "requesting…" :
                   geoStatus === "granted" ? "granted ✓" :
                   geoStatus === "denied" ? "denied — use city →" :
                   "⊙ allow GPS"}
                </button>
                <button
                  className="location-apply"
                  onClick={useCityCoords}
                  disabled={applying}
                >
                  {applying ? "saving…" : "use city coordinates"}
                </button>
              </div>
              <button className="location-back" onClick={() => { setChosen(null); setQuery(""); }}>
                ← back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type Props = { defaultLat?: string; defaultLon?: string };

export default function WeatherBadge({ defaultLat, defaultLon }: Props) {
  const [time, setTime] = useState(() => formatTime(new Date()));
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const locationRef = useRef<SavedLocation | null>(null);

  const hasEnvDefault = Boolean(defaultLat && defaultLon);

  useEffect(() => {
    const tick = setInterval(() => setTime(formatTime(new Date())), TICK_MS);
    return () => clearInterval(tick);
  }, []);

  async function load(loc?: SavedLocation | null) {
    const lat = loc?.lat ?? (defaultLat ? parseFloat(defaultLat) : undefined);
    const lon = loc?.lon ?? (defaultLon ? parseFloat(defaultLon) : undefined);
    const w = await fetchWeather(lat, lon);
    setWeather(w);
  }

  useEffect(() => {
    if (hasEnvDefault) {
      load();
      const poll = setInterval(() => load(), POLL_MS);
      return () => clearInterval(poll);
    }

    const saved = readSavedLocation();
    locationRef.current = saved;

    if (saved) {
      load(saved);
    } else {
      load(null);
    }

    const poll = setInterval(() => load(locationRef.current), POLL_MS);
    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply(loc: SavedLocation) {
    saveLocation(loc);
    locationRef.current = loc;
    setPickerOpen(false);
    load(loc);
  }

  const hasWeather = weather?.label != null;

  const badge = (
    <span className="weather-badge">
      {hasWeather && <span className="weather-icon">{weather!.icon}</span>}
      {hasWeather && <span className="weather-label">{weather!.label}</span>}
      {hasWeather && weather!.temperature != null && (
        <span className="weather-temp">{weather!.temperature}°C</span>
      )}
      {hasWeather && weather!.city && <><span className="weather-sep">·</span><span className="weather-city">{weather!.city}</span></>}
      {hasWeather && <span className="weather-sep">·</span>}
      <span className="weather-time">{time}</span>
    </span>
  );

  if (hasEnvDefault) return badge;

  return (
    <>
      <button className="weather-badge-btn" onClick={() => setPickerOpen(true)} title="Set location">
        {badge}
      </button>
      {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} onApply={handleApply} />}
    </>
  );
}
