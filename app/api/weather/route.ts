import { NextRequest, NextResponse } from "next/server";

export type WeatherPayload = {
  temperature: number;
  label: string;
  icon: string;
  city: string | null;
};

const WMO: Record<number, { label: string; icon: string }> = {
  0:  { label: "clear",          icon: "☀" },
  1:  { label: "mostly clear",   icon: "☀" },
  2:  { label: "partly cloudy",  icon: "⛅" },
  3:  { label: "overcast",       icon: "☁" },
  45: { label: "foggy",          icon: "☁" },
  48: { label: "foggy",          icon: "☁" },
  51: { label: "light drizzle",  icon: "☁" },
  53: { label: "drizzle",        icon: "☁" },
  55: { label: "drizzle",        icon: "☁" },
  61: { label: "light rain",     icon: "☁" },
  63: { label: "rain",           icon: "☁" },
  65: { label: "heavy rain",     icon: "☁" },
  71: { label: "light snow",     icon: "❄" },
  73: { label: "snow",           icon: "❄" },
  75: { label: "heavy snow",     icon: "❄" },
  77: { label: "sleet",          icon: "❄" },
  80: { label: "showers",        icon: "☁" },
  81: { label: "showers",        icon: "☁" },
  82: { label: "heavy showers",  icon: "☁" },
  85: { label: "snow showers",   icon: "❄" },
  86: { label: "snow showers",   icon: "❄" },
  95: { label: "thunderstorm",   icon: "⚡" },
  96: { label: "thunderstorm",   icon: "⚡" },
  99: { label: "thunderstorm",   icon: "⚡" },
};

function decodeWmo(code: number) {
  return WMO[code] ?? { label: "cloudy", icon: "☁" };
}

async function fetchCity(lat: string, lon: string): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "curator-board/1.0" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; county?: string };
    };
    return data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat = params.get("lat") ?? process.env.WEATHER_LAT ?? "";
  const lon = params.get("lon") ?? process.env.WEATHER_LON ?? "";

  if (!lat || !lon) {
    return NextResponse.json({ temperature: null, label: null, icon: null, city: null });
  }

  try {
    const meteoUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weathercode` +
      `&timezone=auto`;

    const [meteoRes, city] = await Promise.all([
      fetch(meteoUrl, { signal: AbortSignal.timeout(8_000), next: { revalidate: 1800 } }),
      fetchCity(lat, lon),
    ]);

    if (!meteoRes.ok) throw new Error(`Open-Meteo ${meteoRes.status}`);

    const json = (await meteoRes.json()) as {
      current: { temperature_2m: number; weathercode: number };
    };

    const temperature = Math.round(json.current.temperature_2m);
    const { label, icon } = decodeWmo(json.current.weathercode);

    const payload: WeatherPayload = { temperature, label, icon, city };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=1800, s-maxage=1800" },
    });
  } catch {
    return NextResponse.json({ temperature: null, label: null, icon: null, city: null });
  }
}
