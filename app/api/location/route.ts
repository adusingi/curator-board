import { NextRequest, NextResponse } from "next/server";

const TIMEOUT = 8_000;

export type CountryItem = { name: string; iso2: string };

export type SearchResult = {
  name: string;
  admin1: string | null;
  lat: number;
  lon: number;
};

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

async function searchCities(query: string, iso2: string): Promise<SearchResult[]> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(query)}&count=20&language=en&format=json`;

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    results?: {
      name: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      country_code: string;
    }[];
  };

  return (json.results ?? [])
    .filter((r) => r.country_code.toLowerCase() === iso2.toLowerCase())
    .slice(0, 8)
    .map((r) => ({ name: r.name, admin1: r.admin1 ?? null, lat: r.latitude, lon: r.longitude }));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const type = params.get("type");

  try {
    if (type === "countries") {
      const data = await getCountries();
      return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=86400" } });
    }

    if (type === "search") {
      const query = params.get("query") ?? "";
      const iso2 = params.get("iso2") ?? "";
      if (query.length < 2 || !iso2) return NextResponse.json([]);
      const data = await searchCities(query, iso2);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
