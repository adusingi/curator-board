# Curator Board

Curator Board is a self-hosted source-code product for technical buyers who want to capture links privately through Telegram, organize them into categories, and publish them on a clean public board.

This repository is in active productization. The current codebase already includes:

- a Next.js public board
- REST API routes for curated links and categories
- a minimal admin surface
- PostgreSQL persistence via Drizzle
- a Telegram ingestion bot

The current implementation still has some transition work in progress:

- the Telegram bot is currently Python-based and is planned to move to TypeScript/Node.js
- product naming is still being normalized across the repo

## Product Direction

V1 is aimed at technical buyers and is intentionally not a hosted SaaS.

- self-hosted source-code product
- one installed copy per buyer
- one curator/admin per installed copy in v1
- Telegram-only ingestion in v1
- optional AI categorization
- optional richer social/video metadata enrichment

The public board is also being redesigned around a built-in multi-theme interface for technical buyers who want a more distinctive, terminal-adjacent aesthetic.

## Current Stack

- `app/` — Next.js 16 App Router UI and API routes
- `components/` — React UI components
- `lib/` + `db/` — Drizzle schema, migrations, seed scripts, and database access
- `agent/` — current Python Telegram bot runtime
- `docker-compose.prod.yml` — production compose for `postgres`, `board`, and `agent`

## How It Works Today

1. A curator sends a URL to the Telegram bot.
2. The agent fetches Open Graph metadata and optional richer social/video metadata.
3. The agent picks a category and writes the resource to the board API.
4. The public site and JSON API expose the curated list.

Current machine auth:

- write routes use `BOARD_API_SECRET` via `x-api-key`

Current human auth:

- admin login via `ADMIN_PASSWORD`
- session-based admin access

## Local Development

### Prerequisites

- Node.js 22+
- `pnpm`
- Docker
- Python 3.11+
- `uv`

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure the board app

```bash
cp .env.example .env.local
```

Current required values in `.env.local`:

- `DATABASE_URL`
- `BOARD_API_SECRET`
- `ADMIN_PASSWORD`

Optional:

- `ADMIN_SESSION_SECRET`

### 3. Install Node dependencies

```bash
pnpm install --ignore-scripts
```

### 4. Prepare the database

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Run the web app

```bash
pnpm dev
```

Board URL: [http://localhost:3000](http://localhost:3000)

### 6. Run the Telegram bot

In a second terminal:

```bash
cd agent
cp .env.example .env
uv sync
uv run python main.py
```

Current required values in `agent/.env`:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_OWNER_ID`
- `ANTHROPIC_API_KEY`
- `BOARD_API_SECRET`
- `BOARD_API_URL=http://localhost:3000`

Optional:

- `SUPADATA_API_KEY`
- `CLAUDE_MODEL`

## Common Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm db:migrate
pnpm db:seed
pnpm db:generate
pnpm db:studio
```

Agent:

```bash
cd agent
uv sync
uv run python main.py
```

## API Surface

### Public read endpoints

- `GET /api/resources`
- `GET /api/resources?category=<slug>`
- `GET /api/resources?q=<query>`
- `GET /api/categories`

### Current protected write endpoints

- `POST /api/resources`
- `PATCH /api/resources/:id`
- `DELETE /api/resources/:id`
- `POST /api/categories`

Write requests currently require:

```text
x-api-key: <BOARD_API_SECRET>
```

Example:

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "x-api-key: <BOARD_API_SECRET>" \
  -d '{"url":"https://example.com","title":"Example","categorySlug":"other"}'
```

## Key Docs

- [docs/PRD.md](/Users/mac3jis/Documents/Code/p/curator-board/docs/PRD.md) — product requirements
- [docs/PLANNING.md](/Users/mac3jis/Documents/Code/p/curator-board/docs/PLANNING.md) — architecture and phased delivery
- [docs/TASKS.md](/Users/mac3jis/Documents/Code/p/curator-board/docs/TASKS.md) — active implementation tracker
- [docs/ARCHITECTURE.md](/Users/mac3jis/Documents/Code/p/curator-board/docs/ARCHITECTURE.md) — current codebase architecture
- [docs/RUNBOOK.md](/Users/mac3jis/Documents/Code/p/curator-board/docs/RUNBOOK.md) — operational notes and commands
- [docs/V1_FINALIZATION_INPUTS.md](/Users/mac3jis/Documents/Code/p/curator-board/docs/V1_FINALIZATION_INPUTS.md) — owner-provided inputs needed before final release sign-off

## Current Gaps Before V1 Sign-Off

- token-based public theming and theme switcher UI
- category create/edit UI behind admin session auth
- no-provider ingestion fallback to `other`
- provider-agnostic AI categorization
- TypeScript/Node.js bot rewrite
- release packaging, licensing, and buyer-facing install materials

## Notes

- Secrets should be injected at runtime, not baked into images.
- The codebase should be treated as the product repo, not a personal deployment snapshot.
- If product docs and code disagree, treat the code as the current implementation and the docs as the intended direction unless a task explicitly says otherwise.
