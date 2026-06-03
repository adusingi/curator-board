# Infiniwa News

Public site: [news.infiniwa.com](https://news.infiniwa.com)

Infiniwa News is a personal curation system for saving and publishing links. A Telegram bot receives URLs, enriches them with metadata, assigns a category with Claude, and writes them into a Next.js + Postgres app that exposes both a public website and a JSON API.

## What it does

- Accepts links through a Telegram bot
- Scrapes Open Graph metadata before calling the LLM
- Uses Claude to map each link to a controlled category set
- Publishes a clean public list with category filters and share actions
- Exposes read APIs for resources and categories
- Exposes write APIs protected by `BOARD_API_SECRET`
- Includes a minimal `/admin` page for correcting titles and categories

## Stack

- `app/` — Next.js 16 App Router frontend and API routes
- `db/` + `lib/` — Drizzle schema, migrations, seed scripts, database access
- `agent/` — Python Telegram bot using `python-telegram-bot`, `httpx`, `BeautifulSoup`, and Anthropic
- `docker-compose.prod.yml` — production compose for `postgres`, `board`, and `agent`

## Architecture

1. A URL is sent to the Telegram bot
2. The agent fetches OG metadata and optional richer video metadata via Supadata
3. Claude picks the best category slug from the seeded taxonomy
4. The agent writes the resource to `POST /api/resources`
5. The public site and API expose the curated list

## Local development

### Prerequisites

- Node.js 22+
- `pnpm`
- Docker
- Python 3.11+
- `uv`

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Configure the board app

```bash
cp .env.example .env.local
```

Required values in `.env.local`:

- `BOARD_API_SECRET`
- `DATABASE_URL` (the example already points at local Docker Postgres)

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

App URL: [http://localhost:3000](http://localhost:3000)

### 6. Run the Telegram agent

In a second terminal:

```bash
cd agent
cp .env.example .env
uv sync
uv run python main.py
```

Required values in `agent/.env`:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_OWNER_ID`
- `ANTHROPIC_API_KEY`
- `SUPADATA_API_KEY` (optional but recommended for richer video metadata)
- `BOARD_API_SECRET` (must match `.env.local`)
- `BOARD_API_URL=http://localhost:3000`

## Common commands

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

## API

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

Write requests require `x-api-key: <BOARD_API_SECRET>`.

Example:

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "x-api-key: <BOARD_API_SECRET>" \
  -d '{"url":"https://example.com","title":"Example","categorySlug":"other"}'
```

## Production

Production runs as a Docker Compose app with:

- `postgres`
- `board` — Next.js app
- `agent` — Telegram bot

Primary production file:

- `docker-compose.prod.yml`

The current public site is [news.infiniwa.com](https://news.infiniwa.com).

## Repo map

- `app/page.tsx` — public homepage
- `app/admin/page.tsx` — admin editor
- `app/api/resources/route.ts` — list/create resources
- `app/api/resources/[id]/route.ts` — update/delete resources
- `app/api/categories/route.ts` — list/create categories
- `components/ResourceList.tsx` — list UI and share actions
- `agent/main.py` — bot entrypoint
- `agent/parser.py` — metadata extraction and category selection
- `docs/RUNBOOK.md` — deployment and troubleshooting

## Notes

- The agent prefers runtime env injection in Docker. Secrets should not be baked into images.
- `SUPADATA_API_KEY` improves metadata quality for YouTube and other social/video links.
- The broader design and operational detail lives in `docs/RUNBOOK.md`, `docs/PRD.md`, and `docs/HANDOFF.md`.
