"use client";

import { useEffect, useState } from "react";
import type { WeatherPayload } from "@/app/api/weather/route";

type State = {
  weather: WeatherPayload | null;
  time: string;
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function loadWeather(lat?: number, lon?: number): Promise<WeatherPayload | null> {
  try {
    const params = lat != null && lon != null ? `?lat=${lat}&lon=${lon}` : "";
    const res = await fetch(`/api/weather${params}`);
    if (!res.ok) return null;
    return (await res.json()) as WeatherPayload;
  } catch {
    return null;
  }
}

function requestGeolocation(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      () => resolve(null),
      { timeout: 6_000 },
    );
  });
}

export default function WeatherBadge() {
  const [state, setState] = useState<State>({ weather: null, time: formatTime(new Date()) });

  useEffect(() => {
    const tick = setInterval(() => {
      setState((prev) => ({ ...prev, time: formatTime(new Date()) }));
    }, 30_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    async function init() {
      const coords = await requestGeolocation();
      const weather = await loadWeather(coords?.latitude, coords?.longitude);
      setState((prev) => ({ ...prev, weather }));
    }
    init();
  }, []);

  const { weather, time } = state;

  if (!weather?.label) {
    return <span className="weather-badge">{time}</span>;
  }

  return (
    <span className="weather-badge">
      <span className="weather-icon">{weather.icon}</span>
      <span className="weather-label">{weather.label}</span>
      {weather.temperature != null && (
        <span className="weather-temp">{weather.temperature}°C</span>
      )}
      {weather.city && <span className="weather-sep">·</span>}
      {weather.city && <span className="weather-city">{weather.city}</span>}
      <span className="weather-sep">·</span>
      <span className="weather-time">{time}</span>
    </span>
  );
}
