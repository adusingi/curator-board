# Handoff — Curator Board
*Next session focus: monitor Dokploy production deployment*

---

## What was built this session

A full Phase 1 implementation snapshot of Curator Board.
Repo: `git@github.com:adusingi/curator-board.git`
Working directory: `/Users/mac3jis/Documents/Code/p/curator-board`

All context is in the docs — do not re-derive from scratch:
- `docs/PRD.md` — product requirements, category table, phase roadmap
- `docs/PLANNING.md` — architecture diagram, tech stack, risk register
- `docs/TASKS.md` — Phase 1 all checked off; Phase 2 (CLI) and Phase 3 (Paywall) tracked
- `docs/RUNBOOK.md` — **start here for environment setup**
- `docs/adr/` — three ADRs covering category strategy, OG scraping, and auth model

---

## Current state

### Infrastructure
- Postgres on **port 5436** via Docker (`docker compose up -d`)
- Port isolation: 5432=Homebrew, 5433=network-mobayilo, 5434=drive-mobayilo, 5435=kazoku-calendar, **5436=curator_board**
- 12 categories seeded
- Next.js board running at `http://localhost:3000` (`pnpm dev`)
- UI confirmed working in browser — hybrid C+B layout (editorial serif + sidebar filter)
- Dokploy production deployment appears to be working after setting `HOSTNAME=0.0.0.0` on the `board` service and fast-forwarding `main`

### Production incident note — 2026-05-26

Public site returned Bad Gateway even though the board logs showed Next.js ready. Inside the `board` container:

```sh
node -e "fetch('http://127.0.0.1:3000/api/categories').then(r => console.log(r.status))"
```

failed with `ECONNREFUSED`, while:

```sh
node -e "fetch('http://' + process.env.HOSTNAME + ':3000/api/categories').then(r => console.log(r.status))"
```

returned `200`. Root cause: Next.js was bound to the container hostname only. Fix: add `HOSTNAME=0.0.0.0` to the `board` service in `docker-compose.prod.yml`, commit `0e0cfe5`, push to `development`, then fast-forward `main`.

### What to monitor next
1. the configured Curator Board domain loads consistently
2. the deployed `/api/categories` endpoint returns 200
3. Dokploy board logs remain clean after redeploys
4. Agent continues polling Telegram and can write to the board API

---

## Next session task list

### 1. Monitoring
- Check the deployed `/api/categories` endpoint after each deploy
- In Dokploy, confirm the domain routes to service `board` on port `3000`
- If Bad Gateway returns, start with `docs/RUNBOOK.md` → "Public site returns Bad Gateway in Dokploy"

### 2. Cleanup
- Prototype route and demo seed script have already been removed

---

## Key files for next session

| File | Purpose |
|---|---|
| `agent/main.py` | Bot entry point — run with `uv run python main.py` |
| `agent/bot.py` | All handlers — URL ingestion + commands |
| `agent/parser.py` | OG scrape + Claude category picker |
| `agent/api_client.py` | HTTP client to board API |
| `agent/.env.example` | Env template for the bot |
| `docker-compose.prod.yml` | Prod deploy — postgres + board + agent |
| `docs/RUNBOOK.md` | Full setup instructions |

---

## Architecture reminder

```
Telegram → Python agent (long polling)
             ↓ scrape OG tags (httpx + BS4)
             ↓ Claude Haiku picks category from seeded list
             ↓ POST /api/resources (x-api-key)
           Next.js board (port 3000)
             ↓
           PostgreSQL (port 5436 local / internal Docker prod)
```

- Public read: `GET /api/resources`, `GET /api/categories`
- API-key write: `POST /api/resources`, `DELETE /api/resources/:id`, `POST /api/categories`
- Bot owner guard: `TELEGRAM_OWNER_ID` env var — set to `0` to allow all

---

## Suggested skills for next session

- **`/update-config`** — if hooks or permissions need adjusting for the new project
- No other special skills needed — straightforward run + deploy session
