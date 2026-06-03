# OG tag scraping before Claude call

When the Telegram bot receives a URL, the agent fetches the page with httpx and extracts Open Graph tags (og:title, og:description, og:site_name) using BeautifulSoup before sending anything to Claude.

## Consequences

- Claude receives a clean title + description summary, not a raw URL — better classification with fewer tokens
- If OG tags are missing (paywalled/JS-rendered pages), the agent falls back to the URL domain as the title and passes the URL alone to Claude
- Keeps LLM cost minimal: one small prompt per resource, not a full page fetch
- Scraping adds ~0.5–2s latency per submission, acceptable for a personal tool
