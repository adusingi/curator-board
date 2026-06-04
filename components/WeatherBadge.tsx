"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherPayload } from "@/app/api/weather/route";
import type { CountryItem, GeoResult } from "@/app/api/location/route";

const LOCATION_KEY = "curator-board-location";
const POLL_MS = 30 * 60 * 1000;
const TICK_MS = 30_000;

type SavedLocation = { lat: number; lon: number; city: string; country: string };

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function readSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

function saveLocation(loc: SavedLocation) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
}

async function fetchWeather(lat?: number, lon?: number): Promise<WeatherPayload | null> {
  try {
    const q = lat != null && lon != null ? `?lat=${lat}&lon=${lon}` : "";
    const res = await fetch(`/api/weather${q}`);
    return res.ok ? ((await res.json()) as WeatherPayload) : null;
  } catch {
    return null;
  }
}

// ─── Location picker sub-component ───────────────────────────────────────────

type PickerProps = { onClose: () => void; onApply: (loc: SavedLocation) => void };

function LocationPicker({ onClose, onApply }: PickerProps) {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [country, setCountry] = useState<CountryItem | null>(null);
  const [city, setCity] = useState("");
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/location?type=countries")
      .then((r) => r.json())
      .then((data: CountryItem[]) => { setCountries(data); setLoadingCountries(false); })
      .catch(() => { setError("Could not load countries."); setLoadingCountries(false); });
  }, []);

  async function onCountryChange(name: string) {
    const found = countries.find((c) => c.name === name) ?? null;
    setCountry(found);
    setCity("");
    setCities([]);
    if (!found) return;
    setLoadingCities(true);
    try {
      const res = await fetch(`/api/location?type=cities&country=${encodeURIComponent(found.name)}`);
      const data: string[] = await res.json();
      setCities(data);
    } catch {
      setError("Could not load cities.");
    } finally {
      setLoadingCities(false);
    }
  }

  async function apply() {
    if (!country || !city) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/location?type=geocode&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country.name)}`,
      );
      const geo: GeoResult = await res.json();
      if (!geo) { setError("Could not locate that city."); return; }
      onApply({ lat: geo.lat, lon: geo.lon, city: geo.name, country: country.name });
    } catch {
      setError("Geocoding failed.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      className="location-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="location-panel">
        <div className="location-header">
          <span className="location-title">set location</span>
          <button className="location-close" onClick={onClose}>esc</button>
        </div>

        <div className="location-body">
          {error && <p className="location-error">{error}</p>}

          <label className="location-label">country</label>
          <select
            className="location-select"
            disabled={loadingCountries}
            value={country?.name ?? ""}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            <option value="">{loadingCountries ? "loading…" : "select country"}</option>
            {countries.map((c) => (
              <option key={c.iso2} value={c.name}>{c.name}</option>
            ))}
          </select>

          <label className="location-label">city</label>
          <select
            className="location-select"
            disabled={!country || loadingCities}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">{loadingCities ? "loading…" : "select city"}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="location-footer">
          <button
            className="location-apply"
            disabled={!city || applying}
            onClick={apply}
          >
            {applying ? "locating…" : "apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main badge ──────────────────────────────────────────────────────────────

export default function WeatherBadge() {
  const [time, setTime] = useState(() => formatTime(new Date()));
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const locationRef = useRef<SavedLocation | null>(null);

  useEffect(() => {
    const tick = setInterval(() => setTime(formatTime(new Date())), TICK_MS);
    return () => clearInterval(tick);
  }, []);

  async function loadWeather(loc?: SavedLocation | null) {
    const w = await fetchWeather(loc?.lat, loc?.lon);
    setWeather(w);
  }

  useEffect(() => {
    const saved = readSavedLocation();
    locationRef.current = saved;

    if (saved) {
      loadWeather(saved);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => loadWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: "", country: "" }),
          () => loadWeather(),
          { timeout: 6_000 },
        );
      } else {
        loadWeather();
      }
    }

    const poll = setInterval(() => loadWeather(locationRef.current ?? undefined), POLL_MS);
    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply(loc: SavedLocation) {
    saveLocation(loc);
    locationRef.current = loc;
    setPickerOpen(false);
    loadWeather(loc);
  }

  const hasWeather = weather?.label != null;

  return (
    <>
      <button className="weather-badge" onClick={() => setPickerOpen(true)} title="Set location">
        {hasWeather && <span className="weather-icon">{weather.icon}</span>}
        {hasWeather && <span className="weather-label">{weather.label}</span>}
        {hasWeather && weather.temperature != null && (
          <span className="weather-temp">{weather.temperature}°C</span>
        )}
        {hasWeather && weather.city && <span className="weather-sep">·</span>}
        {hasWeather && weather.city && <span className="weather-city">{weather.city}</span>}
        {hasWeather && <span className="weather-sep">·</span>}
        <span className="weather-time">{time}</span>
      </button>

      {pickerOpen && (
        <LocationPicker onClose={() => setPickerOpen(false)} onApply={handleApply} />
      )}
    </>
  );
}
