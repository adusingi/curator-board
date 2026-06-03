export type Category = {
  id: number;
  name: string;
  slug: string;
  seeded: boolean;
};

export type Resource = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  category: Category;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: unknown;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function boardApiUrl(): string {
  return requireEnv("BOARD_API_URL").replace(/\/+$/, "");
}

function jsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": requireEnv("BOARD_API_SECRET"),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function postResource(
  url: string,
  title: string,
  description: string | null,
  categorySlug: string,
): Promise<ApiEnvelope<Resource>> {
  const response = await fetch(`${boardApiUrl()}/api/resources`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ url, title, description, categorySlug }),
    signal: AbortSignal.timeout(15_000),
  });
  return parseJson<ApiEnvelope<Resource>>(response);
}

export async function getResources(category?: string, limit = 10): Promise<Resource[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category) {
    params.set("category", category);
  }

  const response = await fetch(`${boardApiUrl()}/api/resources?${params.toString()}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch resources: ${response.status}`);
  }

  const payload = await parseJson<ApiEnvelope<Resource[]>>(response);
  return payload.data ?? [];
}

export async function deleteResource(resourceId: number): Promise<boolean> {
  const response = await fetch(`${boardApiUrl()}/api/resources/${resourceId}`, {
    method: "DELETE",
    headers: jsonHeaders(),
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok;
}

export async function searchResources(query: string): Promise<Resource[]> {
  const params = new URLSearchParams({ q: query, limit: "10" });
  const response = await fetch(`${boardApiUrl()}/api/resources?${params.toString()}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to search resources: ${response.status}`);
  }

  const payload = await parseJson<ApiEnvelope<Resource[]>>(response);
  return payload.data ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${boardApiUrl()}/api/categories`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const payload = await parseJson<ApiEnvelope<Category[]>>(response);
  return payload.data ?? [];
}

export async function addCategory(name: string, slug: string): Promise<ApiEnvelope<Category>> {
  const response = await fetch(`${boardApiUrl()}/api/categories`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ name, slug }),
    signal: AbortSignal.timeout(10_000),
  });
  return parseJson<ApiEnvelope<Category>>(response);
}
