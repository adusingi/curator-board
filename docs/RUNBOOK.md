# RUNBOOK — Curator Board
*Last updated: 2026-06-04*

Operational notes for the current Curator Board codebase.

This document describes the repo as it works today.

## Current Runtime Shape

Today the repo runs as:

- `board` — Next.js 16 web app and API
- `postgres` — PostgreSQL 16
- `agent` — TypeScript/Node.js Telegram bot

Important transition notes:

- machine write auth currently uses `BOARD_API_SECRET`
- human admin auth now uses `ADMIN_PASSWORD` + session login

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

Current required board values:

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

Current required agent values:

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
pnpm db:migrate
pnpm db:seed
pnpm db:generate
pnpm db:studio
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

### Production

`docker-compose.prod.yml` currently defines:

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

Supported `GET /api/resources` filters:

- `?category=<slug>`
- `?q=<query>`
- `?limit=<n>`
- `?offset=<n>`

### Current protected write endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/resources` | `x-api-key` | Create or upsert resource |
| PATCH | `/api/resources/:id` | `x-api-key` or admin session | Update title, description, or category |
| DELETE | `/api/resources/:id` | `x-api-key` or admin session | Delete resource |
| POST | `/api/categories` | `x-api-key` or admin session | Create category |
| PATCH | `/api/categories/:id` | `x-api-key` or admin session | Update category |

Example:

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "x-api-key: <BOARD_API_SECRET>" \
  -d '{"url":"https://example.com","title":"Test","categorySlug":"other"}'
```

## Admin Surface

Current paths:

```text
http://localhost:3000/admin
http://localhost:3000/admin/login
```

Current behavior:

- the login page accepts `ADMIN_PASSWORD`
- successful login sets an admin session cookie
- the admin page requires that session cookie
- resource save and delete actions work without exposing `BOARD_API_SECRET` in the browser
- category create and edit now work without exposing `BOARD_API_SECRET` in the browser

## Secrets

### Board (`.env.local`)

Current required values:

| Key | Notes |
|---|---|
| `DATABASE_URL` | Local default is already provided in `.env.example` |
| `BOARD_API_SECRET` | Required for current machine-auth write routes |
| `ADMIN_PASSWORD` | Required for human admin login |

Current optional values:

| Key | Notes |
|---|---|
| `ADMIN_SESSION_SECRET` | Optional explicit cookie-signing secret |

### Agent (`agent/.env`)

Current required values:

| Key | Notes |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
| `TELEGRAM_OWNER_ID` | Telegram user ID allowed to operate the bot |
| `BOARD_API_SECRET` | Must match the board secret |
| `BOARD_API_URL` | Local dev usually `http://localhost:3000` |

Current optional values:

| Key | Notes |
|---|---|
| `AI_PROVIDER` | `auto`, `anthropic`, `openai`, or `none`; `auto` prefers Anthropic, then OpenAI, then no-provider fallback |
| `AI_MODEL` | Generic model override for the selected provider |
| `ANTHROPIC_API_KEY` | Enables Anthropic-based categorization when present |
| `OPENAI_API_KEY` | Enables OpenAI-based categorization when present |
| `SUPADATA_API_KEY` | Improves social/video metadata |
| `CLAUDE_MODEL` | Legacy Anthropic-specific model override; used only when `AI_MODEL` is unset |

## Production Deployment Notes

This repo is being shaped into a self-hosted product repo, not a single personal deployment.

What is safe to state today:

- the app has a Docker Compose production path
- the board can run separately from the bot
- the product intends to support a Vercel-friendly web deployment path plus a separate bot runtime

What should not be assumed finalized yet:

- final public production domain
- final release packaging
- final bot runtime language

## Health Checks

### Local

```bash
curl http://localhost:3000
curl http://localhost:3000/api/categories
psql postgresql://curator_board:curator_board@localhost:5436/curator_board -c "SELECT 1;"
docker compose ps
```

### Container-level board check

If you need to test the board from inside a minimal container image:

```sh
node -e "fetch('http://127.0.0.1:3000/api/categories').then(r => console.log(r.status)).catch(e => { console.error(e); process.exit(1) })"
```

## Common Troubleshooting

### `database \"mac3jis\" does not exist`

This usually means the script is not using the intended local environment file or PostgreSQL is not running.

Check:

```bash
docker compose up -d
pnpm db:migrate
```

### PostgreSQL connection fails on port `5432`

Local Docker PostgreSQL is on `5436`, not `5432`.

Check `DATABASE_URL` and make sure it ends with `:5436/curator_board`.

### `pnpm install` or `pnpm lint` fails because builds are ignored

This environment can stop when package build scripts have not been approved.

Current observed error pattern:

- `ERR_PNPM_IGNORED_BUILDS`

If that happens, approve the needed builds in the local environment before relying on `pnpm`-driven verification.

### Bot starts before the board is ready

The bot already waits for `/api/categories` before polling Telegram, but only for a bounded number of attempts. If startup ordering still fails, check:

- `BOARD_API_URL`
- board container health
- local network reachability between `agent` and `board`

### Admin login returns `ADMIN_PASSWORD is not configured`

Add `ADMIN_PASSWORD` to `.env.local` or the production board environment, then restart the app.
