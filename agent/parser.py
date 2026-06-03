"""OG tag scraper + provider-agnostic category picker."""
import json
import logging
import os
import re
from typing import Awaitable, Callable

import httpx
import anthropic
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"

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


def _configured_provider() -> str:
    return os.environ.get("AI_PROVIDER", "auto").strip().lower()


def _configured_model(provider: str) -> str:
    generic_model = os.environ.get("AI_MODEL", "").strip()
    if generic_model:
        return generic_model

    if provider == "anthropic":
        return os.environ.get("CLAUDE_MODEL", "").strip() or DEFAULT_ANTHROPIC_MODEL

    if provider == "openai":
        return DEFAULT_OPENAI_MODEL

    return ""


def _resolve_provider() -> str:
    configured_provider = _configured_provider()
    if configured_provider in {"none", "anthropic", "openai"}:
        return configured_provider

    if configured_provider not in {"", "auto"}:
        logger.warning("Unknown AI_PROVIDER=%r. Falling back to auto detection.", configured_provider)

    if os.environ.get("ANTHROPIC_API_KEY"):
        return "anthropic"

    if os.environ.get("OPENAI_API_KEY"):
        return "openai"

    return "none"


def _extract_slug(raw: str, slugs: list[str]) -> str:
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if not match:
        return "other"

    try:
        data = json.loads(match.group())
    except Exception:
        return "other"

    slug = data.get("slug", "other")
    return slug if slug in slugs else "other"


def _anthropic_client() -> anthropic.Anthropic | None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    return anthropic.Anthropic(api_key=api_key)


async def _pick_category_with_anthropic(user_msg: str, slugs: list[str]) -> str:
    client = _anthropic_client()
    if not client:
        return "other"

    try:
        resp = client.messages.create(
            model=_configured_model("anthropic"),
            max_tokens=64,
            system=_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        return _extract_slug(resp.content[0].text.strip(), slugs)
    except Exception:
        return "other"


async def _pick_category_with_openai(user_msg: str, slugs: list[str]) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return "other"

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _configured_model("openai"),
                    "temperature": 0,
                    "messages": [
                        {"role": "system", "content": _SYSTEM},
                        {"role": "user", "content": user_msg},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"]["content"].strip()
            return _extract_slug(raw, slugs)
    except Exception:
        return "other"


CategoryPicker = Callable[[str, list[str]], Awaitable[str]]


PROVIDER_PICKERS: dict[str, CategoryPicker] = {
    "anthropic": _pick_category_with_anthropic,
    "openai": _pick_category_with_openai,
}


async def pick_category(url: str, title: str, description: str | None, categories: list[dict]) -> str:
    """Pick the best category slug using the configured provider."""
    slugs = [c["slug"] for c in categories]
    user_msg = (
        f"URL: {url}\nTitle: {title}\nDescription: {description or 'N/A'}\n\n"
        f"Available category slugs: {json.dumps(slugs)}"
    )

    provider = _resolve_provider()
    if provider == "none":
        logger.info("No AI provider configured. Falling back to 'other'.")
        return "other"

    picker = PROVIDER_PICKERS.get(provider)
    if picker:
        return await picker(user_msg, slugs)

    logger.warning("No category picker is registered for provider=%r. Falling back to 'other'.", provider)
    return "other"
