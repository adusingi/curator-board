"""OG tag scraper + Claude category picker."""
import json
import os
import re
import httpx
import anthropic
from bs4 import BeautifulSoup

_claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

_SYSTEM = """You are a resource categorisation assistant.
Given a URL, title, and description, pick the single best matching category slug from the list provided.
Respond ONLY with valid JSON: {"slug": "<slug>"}
If nothing fits well, use "other"."""

_YT_RE = re.compile(r'(?:youtube\.com/(?:watch\?v=|shorts/)|youtu\.be/)([A-Za-z0-9_-]+)')
_SOCIAL_RE = re.compile(
    r'(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|fb\.watch)',
    re.IGNORECASE,
)


async def _supadata_metadata(url: str) -> dict | None:
    """Fetch full video metadata (title + real description) via Supadata API."""
    api_key = os.environ.get("SUPADATA_API_KEY")
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.supadata.ai/v1/metadata",
                params={"url": url},
                headers={"x-api-key": api_key},
            )
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title")
                description = data.get("description")
                if title:
                    if description and len(description) > 1000:
                        description = description[:997] + "..."
                    return {"title": title, "description": description}
    except Exception:
        pass
    return None


async def _youtube_oembed(url: str) -> dict | None:
    """Fetch title + channel name via YouTube oEmbed (no API key needed)."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"https://www.youtube.com/oembed?url={url}&format=json")
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title")
                author = data.get("author_name")
                if title:
                    return {"title": title, "description": f"YouTube video by {author}" if author else None}
    except Exception:
        pass
    return None


async def scrape_og(url: str) -> dict:
    """Fetch Open Graph metadata from a URL. Returns title, description."""
    if _SOCIAL_RE.search(url):
        if _YT_RE.search(url):
            result = await _supadata_metadata(url) or await _youtube_oembed(url)
        else:
            result = await _supadata_metadata(url)
        if result:
            return result

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

        def _og(prop: str) -> str | None:
            tag = soup.find("meta", property=f"og:{prop}") or soup.find("meta", attrs={"name": prop})
            return tag.get("content", "").strip() if tag else None

        title = (
            _og("title")
            or (soup.title.string.strip() if soup.title else None)
            or _domain(url)
        )
        description = _og("description") or _meta_desc(soup)
        return {"title": title, "description": description}
    except Exception:
        return {"title": _domain(url), "description": None}


def _domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url


def _meta_desc(soup: BeautifulSoup) -> str | None:
    tag = soup.find("meta", attrs={"name": "description"})
    return tag.get("content", "").strip() if tag else None


async def pick_category(url: str, title: str, description: str | None, categories: list[dict]) -> str:
    """Ask Claude to pick the best category slug."""
    slugs = [c["slug"] for c in categories]
    user_msg = (
        f"URL: {url}\nTitle: {title}\nDescription: {description or 'N/A'}\n\n"
        f"Available category slugs: {json.dumps(slugs)}"
    )
    try:
        resp = _claude.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=64,
            system=_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = resp.content[0].text.strip()
        # extract JSON even if Claude adds surrounding text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            slug = data.get("slug", "other")
            return slug if slug in slugs else "other"
    except Exception:
        pass
    return "other"
