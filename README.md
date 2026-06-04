# Curator Board

Curator Board is a self-hosted source-code product for technical buyers who want to capture links privately through Telegram, organize them into categories, and publish them on a clean public board.

This repository is in active productization. The current codebase already includes:

- a Next.js public board
- REST API routes for curated links and categories
- a minimal admin surface
- PostgreSQL persistence via Drizzle
- a Telegram ingestion bot

## Product Direction

V1 is aimed at technical buyers and is intentionally not a hosted SaaS.

- self-hosted source-code product — deploy on your own server
- one installed copy per buyer
- one curator/admin per installed copy in v1
- Telegram-only ingestion in v1
- optional AI categorization
- optional richer social/video metadata enrichment
- full stack runs on a single VPS with one Docker Compose command

The public board ships with a built-in multi-theme interface for a distinctive, terminal-adjacent aesthetic.

## Current Stack

- `app/` — Next.js 16 App Router UI and API routes
- `components/` — React UI components
- `lib/` + `db/` — Drizzle schema, migrations, seed scripts, and database access
- `agent/` — TypeScript Telegram bot runtime
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
cp agent/.env.example agent/.env
pnpm agent:start
```

Current required values in `agent/.env`:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_OWNER_ID`
- `BOARD_API_SECRET`
- `BOARD_API_URL=http://localhost:3000`

Optional:

- `AI_PROVIDER` (`auto`, `anthropic`, `openai`, or `none`)
- `AI_MODEL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPADATA_API_KEY`
- `CLAUDE_MODEL` (legacy Anthropic override; `AI_MODEL` takes precedence)

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
pnpm agent:start
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
- `PATCH /api/categories/:id`

Machine write requests currently require:

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

## Deployment

Buyers deploy the full stack — board, bot, and database — on a single VPS with one command:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

See `docs/deploy/install-guide.md` for the complete buyer setup guide.

## Key Docs

- [docs/deploy/install-guide.md](docs/deploy/install-guide.md) — buyer deployment guide
- [docs/deploy/deploy-docker.md](docs/deploy/deploy-docker.md) — Docker full-stack reference
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — local development and operational notes
- [docs/TASKS.md](docs/TASKS.md) — active implementation tracker

## Notes

- Secrets should be injected at runtime, not baked into images.
- The codebase should be treated as the product repo, not a personal deployment snapshot.
- If product docs and code disagree, treat the code as the current implementation and the docs as the intended direction unless a task explicitly says otherwise.
