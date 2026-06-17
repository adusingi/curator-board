# RUNBOOK — Curator Board
*Last updated: 2026-06-05*

Operational notes for the current Curator Board codebase.

## Current Runtime Shape

The repo runs as:

- `board` — Next.js 16 web app and API
- `postgres` — PostgreSQL 16
- `agent` — TypeScript/Node.js Telegram bot

Auth model:

- machine write auth uses `BOARD_API_SECRET`
- human admin auth uses `ADMIN_PASSWORD` plus session login

## Ports At A Glance

| Service | Port | URL |
|---|---|---|
| Board app | 3000 | http://localhost:3000 |
| PostgreSQL (Docker) | 5436 | localhost:5436 |
| Drizzle Studio | 4983 | http://localhost:4983 |

Local PostgreSQL uses `5436` to avoid conflicts with other local projects.

## First-Time Local Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure the board app

```bash
cp .env.example .env.local
```

Required board values:

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
pnpm db:backfill
pnpm db:seed
```

### 5. Start the board

```bash
pnpm dev
```

Board URL: [http://localhost:3000](http://localhost:3000)

### 6. Start the Telegram bot

In a second terminal:

```bash
cp agent/.env.example agent/.env
pnpm agent:start
```

Required agent values:

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

## Daily Development

Start the database:

```bash
docker compose up -d
```

Start the web app:

```bash
pnpm dev
```

Only start the bot locally when you need to test ingestion:

```bash
pnpm agent:start
```

## Database

### Local credentials

```text
Host:     localhost
Port:     5436
User:     curator_board
Password: curator_board
Database: curator_board
```

### Commands

```bash
pnpm db:migrate    # apply schema migrations
pnpm db:backfill   # fill OKF type/tags/slug on existing rows, finalize slug NOT NULL + UNIQUE
pnpm db:seed       # seed default categories
pnpm db:generate
pnpm db:studio
```

**Run order matters** on an existing (already-populated) database:
`db:migrate` → `db:backfill` → `db:seed`. Migration `0001` adds `slug` as nullable so it is safe on
populated tables; `db:backfill` then fills every slug and promotes the column to `NOT NULL` + `UNIQUE`.
The production container runs all three automatically on boot (see `Dockerfile` `CMD`). Both
`db:migrate` and `db:backfill` are idempotent.

### OKF bundle

Every resource is a valid OKF v0.1 concept (see `docs/adr/0004-okf-native-resources.md`). Regenerate the
markdown projection under `knowledge/` (git-ignored, environment-specific) from the DB:

```bash
pnpm okf:export
```

### Connect with `psql`

```bash
psql postgresql://curator_board:curator_board@localhost:5436/curator_board
```

## Docker Compose

### Local

`docker-compose.yml` runs PostgreSQL only.

```bash
docker compose up -d
docker compose down
docker compose down -v
docker compose logs -f postgres
docker compose ps
```

### Production-style stack

`docker-compose.prod.yml` defines:

- `postgres`
- `board`
- `agent`

The board container:

- builds from the repo root `Dockerfile`
- exposes port `3000` internally
- runs with `HOSTNAME=0.0.0.0`
- reads `BOARD_API_SECRET` and a container-local `DATABASE_URL`

The agent container:

- builds from `agent/Dockerfile`
- talks to the board via `BOARD_API_URL=http://board:3000`
- uses `BOARD_API_SECRET` for machine writes
- runs `pnpm exec tsx agent/main.ts`

## Board Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Agent Commands

```bash
pnpm agent:start
```

## API Reference

### Public read endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/resources` | none | List resources |
| GET | `/api/categories` | none | List categories |

Each resource is returned with its full OKF concept fields (`type`, `tags`, `slug`) alongside
`url`/`title`/`description`/`category`.

Supported `GET /api/resources` filters:

- `?category=<slug>`
- `?q=<query>`
- `?limit=<n>`
- `?offset=<n>`

### Protected write endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/resources` | `x-api-key` | Create or upsert resource |
| PATCH | `/api/resources/:id` | `x-api-key` or admin session | Update title, description, or category |
| DELETE | `/api/resources/:id` | `x-api-key` or admin session | Delete a resource |
| POST | `/api/categories` | `x-api-key` or admin session | Create a category |
| PATCH | `/api/categories/:id` | `x-api-key` or admin session | Update a category |
