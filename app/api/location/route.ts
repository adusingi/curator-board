import { NextRequest, NextResponse } from "next/server";

const TIMEOUT = 8_000;

export type CountryItem = { name: string; iso2: string };
export type GeoResult = { lat: number; lon: number; name: string } | null;

async function getCountries(): Promise<CountryItem[]> {
  const res = await fetch("https://countriesnow.space/api/v0.1/countries/iso", {
    signal: AbortSignal.timeout(TIMEOUT),
    next: { revalidate: 86_400 },
  });
  if (!res.ok) throw new Error(`CountriesNow ${res.status}`);
  const json = (await res.json()) as { data: { name: string; Iso2: string }[] };
  return json.data
    .map((c) => ({ name: c.name, iso2: c.Iso2 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getCities(country: string): Promise<string[]> {
  const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`CountriesNow cities ${res.status}`);
  const json = (await res.json()) as { data: string[] };
  return json.data.sort((a, b) => a.localeCompare(b));
}

async function geocodeCity(city: string, country: string): Promise<GeoResult> {
  const query = encodeURIComponent(`${city}, ${country}`);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { latitude: number; longitude: number; name: string }[] };
  const first = json.results?.[0];
  if (!first) return null;
  return { lat: first.latitude, lon: first.longitude, name: first.name };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const type = params.get("type");

  try {
    if (type === "countries") {
      const data = await getCountries();
      return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=86400" } });
    }

    if (type === "cities") {
      const country = params.get("country") ?? "";
      if (!country) return NextResponse.json([], { status: 400 });
      const data = await getCities(country);
      return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=3600" } });
    }

    if (type === "geocode") {
      const city = params.get("city") ?? "";
      const country = params.get("country") ?? "";
      if (!city) return NextResponse.json(null, { status: 400 });
      const data = await geocodeCity(city, country);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
