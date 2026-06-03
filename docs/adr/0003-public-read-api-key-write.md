# Public read, API-key-protected write

All GET endpoints on /api/resources and /api/categories are public — no auth required. POST /api/resources requires an x-api-key header matching BOARD_API_SECRET. The web UI is public with no login.

## Consequences

- AI agents and RSS readers can query the feed without credentials
- Only the Telegram bot (and future Go CLI) can add resources — both embed the API key in their config
- Paywall (Phase 3) will add a second auth layer on top of this; the API key layer stays as the internal write guard
- No session management, no NextAuth needed in Phase 1
