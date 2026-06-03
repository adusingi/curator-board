"""HTTP client for the Curator Board API."""
import os
import httpx

BOARD_API_URL = os.environ["BOARD_API_URL"].rstrip("/")
BOARD_API_SECRET = os.environ["BOARD_API_SECRET"]

HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": BOARD_API_SECRET,
}


async def post_resource(url: str, title: str, description: str | None, category_slug: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            f"{BOARD_API_URL}/api/resources",
            json={"url": url, "title": title, "description": description, "categorySlug": category_slug},
            headers=HEADERS,
        )
        res.raise_for_status()
        return res.json()


async def get_resources(category: str | None = None, limit: int = 10) -> list[dict]:
    params: dict = {"limit": limit}
    if category:
        params["category"] = category
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(f"{BOARD_API_URL}/api/resources", params=params)
        res.raise_for_status()
        return res.json().get("data", [])


async def delete_resource(resource_id: int) -> bool:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.delete(
            f"{BOARD_API_URL}/api/resources/{resource_id}",
            headers=HEADERS,
        )
        return res.status_code == 200


async def search_resources(query: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{BOARD_API_URL}/api/resources",
            params={"q": query, "limit": 10},
        )
        res.raise_for_status()
        return res.json().get("data", [])


async def get_categories() -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(f"{BOARD_API_URL}/api/categories")
        res.raise_for_status()
        return res.json().get("data", [])


async def add_category(name: str, slug: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            f"{BOARD_API_URL}/api/categories",
            json={"name": name, "slug": slug},
            headers=HEADERS,
        )
        res.raise_for_status()
        return res.json()
