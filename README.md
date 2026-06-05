# Curator Board

Curator Board is an open-source link curation app for collecting links through Telegram, organizing them into categories, and publishing them on a clean public board.

The repository currently includes:

- a Next.js public board
- REST API routes for resources and categories
- a session-based admin UI
- PostgreSQL persistence via Drizzle
- a TypeScript Telegram ingestion bot

## Project Direction

Curator Board is now maintained as an open-source project.

- self-hosted by default
- one admin account per installation in the current release
- Telegram-only ingestion in the current release
- optional AI categorization
- optional richer social and video metadata enrichment
- Docker Compose deployment for the full stack

The public board ships with a built-in multi-theme interface.

## Current Stack

- `app/` — Next.js 16 App Router UI and API routes
- `components/` — React UI components
- `lib/` + `db/` — Drizzle schema, migrations, seed scripts, and database access
- `agent/` — TypeScript Telegram bot runtime
- `docker-compose.prod.yml` — production compose for `postgres`, `board`, and `agent`

## How It Works

1. An admin sends a URL to the Telegram bot.
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

Required values in `.env.local`:

- `DATABASE_URL`
- `BOARD_API_SECRET`
- `ADMIN_PASSWORD`

Optional:

- `ADMIN_SESSION_SECRET`

### 3. Install dependencies

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

Required values in `agent/.env`:

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

### Protected write endpoints

- `POST /api/resources`
- `PATCH /api/resources/:id`
- `DELETE /api/resources/:id`
- `POST /api/categories`
- `PATCH /api/categories/:id`

Machine write requests require:

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

Run the full stack locally or on a server with:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

See [docs/deploy/install-guide.md](./docs/deploy/install-guide.md) for a step-by-step setup guide.

## Contributing

Open an issue or submit a pull request if you want to improve Curator Board. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the current workflow.

## Support

- Support the project: [Buy Me a Coffee](https://buymeacoffee.com/adusingi)
- Source code: [GitHub](https://github.com/adusingi/curator-board)

## Key Docs

- [docs/deploy/install-guide.md](./docs/deploy/install-guide.md) — setup guide
- [docs/deploy/deploy-docker.md](./docs/deploy/deploy-docker.md) — Docker full-stack reference
- [docs/deploy/deploy-bot.md](./docs/deploy/deploy-bot.md) — standalone bot deployment
- [docs/RUNBOOK.md](./docs/RUNBOOK.md) — local development and operational notes
- [docs/TASKS.md](./docs/TASKS.md) — active implementation tracker

## Notes

- Secrets should be injected at runtime, not baked into images.
- Human admin auth and bot auth are intentionally separate.
- If no AI provider key is configured, ingestion still works and falls back to category `other`.
