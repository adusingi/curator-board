# RUNBOOK — Resources (Infiniwa)
*Last updated: 2026-05-24*

---

## Ports at a Glance

| Service | Port | URL |
|---|---|---|
| Next.js board | 3000 | http://localhost:3000 |
| PostgreSQL (Docker) | **5436** | localhost:5436 |
| Drizzle Studio | 4983 | http://localhost:4983 |

> **Why 5436?** Port isolation across projects: 5432 = local Homebrew, 5436 = network-mobayilo, 5434 = drive-mobayilo, 5435 = kazoku-calendar, **5436 = resources**.

---

## First-Time Setup

```bash
# 1. Start the database
docker compose up -d

# 2. Copy and fill env file
cp .env.example .env.local
# Edit .env.local — set BOARD_API_SECRET:
#   BOARD_API_SECRET=$(openssl rand -hex 32)
# Everything else works as-is for local dev.

# 3. Install Node dependencies
pnpm install --ignore-scripts

# 4. Run DB migrations + seed categories
pnpm db:migrate
pnpm db:seed

# 5. Start the board
pnpm dev
```

Board is at http://localhost:3000.

### Agent (Telegram bot) — separate terminal

```bash
cd agent

# Install Python deps
uv sync

# Copy and fill env
cp .env.example .env
# Required: TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID, ANTHROPIC_API_KEY
# BOARD_API_SECRET must match the one in ../.env.local
# BOARD_API_URL=http://localhost:3000 for local dev

# Run
uv run python main.py
```

---

## Daily Development

```bash
# 1. Start postgres (if not already running)
docker compose up -d

# 2. Start Next.js board
pnpm dev
```

In a second terminal (only if testing the bot locally):

```bash
cd agent && uv run python main.py
```

---

## Database

### Credentials (local dev)

```
Host:     localhost
Port:     5436  ← not 5432
User:     resources
Password: resources
Database: resources
```

### Commands

```bash
pnpm db:migrate    # Apply pending migrations (reads .env.local automatically)
pnpm db:seed       # Seed the 12 default categories (safe to re-run — conflict ignored)
pnpm db:generate   # Generate new migration file after schema changes in lib/schema.ts
pnpm db:studio     # Open Drizzle Studio at http://localhost:4983
```

### Connect with psql

```bash
psql postgresql://resources:resources@localhost:5436/resources
```

### Migration files

```
db/migrations/
└── 0000_concerned_doctor_strange.sql   # Initial schema (categories + resources tables)
```

---

## Docker Compose

```bash
# Start postgres (detached)
docker compose up -d

# Stop postgres
docker compose down

# Stop and wipe all data (full reset — ⚠️ deletes everything)
docker compose down -v

# View logs
docker compose logs -f postgres

# Check status
docker compose ps
```

---

## Board — Next.js Commands

```bash
pnpm dev       # Dev server with hot reload — http://localhost:3000
pnpm build     # Production build
pnpm start     # Serve production build
pnpm lint      # ESLint
```

---

## Agent — Python Bot Commands

```bash
cd agent

uv sync                  # Install / sync dependencies
uv run python main.py    # Start the bot (long polling)
```

---

## API Reference (quick)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/resources` | none | List resources (`?category=slug`, `?q=query`, `?limit=N`) |
| POST | `/api/resources` | x-api-key | Add resource |
| PATCH | `/api/resources/:id` | x-api-key | Edit title, description, or category |
| DELETE | `/api/resources/:id` | x-api-key | Remove resource |
| GET | `/api/categories` | none | List all categories |
| POST | `/api/categories` | x-api-key | Add category |

Test a POST locally:

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "x-api-key: <your BOARD_API_SECRET>" \
  -d '{"url":"https://example.com","title":"Test","categorySlug":"other"}'
```

---

## Admin Page

A minimal owner-only interface for editing resource titles and categories.

```
http://localhost:3000/admin
https://resources.infiniwa.com/admin
```

Enter your `BOARD_API_SECRET` when prompted. All saves call `PATCH /api/resources/:id` with that key.

Use it to fix resources where the title was auto-detected incorrectly (e.g. YouTube videos parsed as "- YouTube").

---

## Required Secrets

### Board (`.env.local`)

| Key | How to get |
|---|---|
| `BOARD_API_SECRET` | `openssl rand -hex 32` |
| `DATABASE_URL` | Already set correctly in `.env.example` for local dev |

### Agent (`agent/.env`)

| Key | How to get |
|---|---|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) — `/newbot` |
| `TELEGRAM_OWNER_ID` | [@userinfobot](https://t.me/userinfobot) — send any message |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `SUPADATA_API_KEY` | [supadata.ai](https://supadata.ai) |
| `BOARD_API_SECRET` | Same value as board `.env.local` |

---

## Production Deploy (Dokploy)

1. Push `development` branch → merge to `main`
2. In Dokploy, create a new **Docker Compose** app pointing to `docker-compose.prod.yml`
3. Set all env vars from the table above
4. Point DNS: `resources.infiniwa.com` → Dokploy instance IP
5. Dokploy handles Let's Encrypt SSL automatically

The prod compose runs three containers: `postgres`, `board` (Next.js), `agent` (Python bot).
Migrations + seed run automatically inside the board container on startup.
The `board` container sets `HOSTNAME=0.0.0.0` so Next.js listens on all container interfaces for Dokploy/Traefik.

---

## Health Checks

```bash
# Board responds
curl http://localhost:3000

# Postgres reachable
psql postgresql://resources:resources@localhost:5436/resources -c "SELECT 1;"

# Postgres via Docker
docker exec resources-postgres-1 pg_isready -U resources -d resources

# API responds (public)
curl http://localhost:3000/api/categories
```

### Dokploy container checks

The production board image is Alpine-based, so `bash` and `curl` are not installed by default. Use `/bin/sh` in the Dokploy terminal and Node's built-in `fetch`:

```sh
# From the board container: confirms Next is reachable on loopback
node -e "fetch('http://127.0.0.1:3000/api/categories').then(r => console.log(r.status)).catch(e => { console.error(e); process.exit(1) })"

# If debugging bind address specifically: should also return 200
node -e "fetch('http://' + process.env.HOSTNAME + ':3000/api/categories').then(r => console.log(r.status)).catch(e => { console.error(e); process.exit(1) })"
```

---

## Common Troubleshooting

### `database "mac3jis" does not exist`

`tsx` does not auto-load `.env.local`. The scripts now use `--env-file .env.local`.
If you still see this error, confirm Docker postgres is running first:

```bash
docker compose up -d
pnpm db:migrate
```

### Port 5432 conflict

Docker postgres is on **5436**. If you see a connection refused on 5432, check your `DATABASE_URL` — it must end in `:5436/resources`.

### `pnpm install` errors (build scripts ignored)

```bash
pnpm install --ignore-scripts
```

The `pnpm.onlyBuiltDependencies` in `package.json` already handles this, but `--ignore-scripts` is a safe fallback.

### Telegram bot not responding

- Confirm `TELEGRAM_BOT_TOKEN` is set and correct
- Check `TELEGRAM_OWNER_ID` — if set to `0`, all users can trigger the bot
- Confirm `BOARD_API_URL` points to a reachable board (use `http://localhost:3000` locally, `http://board:3000` inside Docker)

### Category not found when bot adds a resource

Run `pnpm db:seed` to ensure the 12 default categories exist. The seed is idempotent.

### Public site returns Bad Gateway in Dokploy

**Symptom:** Dokploy shows `board`, `agent`, and `postgres` running, board logs show Next.js ready, but `https://resources.infiniwa.com` returns Bad Gateway.

**Known fix:** The board service must bind Next.js to all interfaces:

```yaml
board:
  environment:
    HOSTNAME: 0.0.0.0
```

This is already present in `docker-compose.prod.yml`. After changing this value, redeploy the full Docker Compose app in Dokploy, not just one service.

**Confirm it:**
From the board container terminal in Dokploy:
```sh
node -e "fetch('http://127.0.0.1:3000/api/categories').then(r => console.log(r.status)).catch(e => { console.error(e); process.exit(1) })"
```
Expected output: `200`.

If `http://$HOSTNAME:3000/api/categories` works but `http://127.0.0.1:3000/api/categories` fails with `ECONNREFUSED`, Next.js is bound to the container hostname only. Re-check `HOSTNAME=0.0.0.0` and redeploy.

If the container check returns `200` but the public domain still returns Bad Gateway, verify the Dokploy domain routes to service `board` on port `3000`, then redeploy the Compose app so Traefik labels are regenerated.

### "❌ Board unavailable" in Telegram after Dokploy redeploy

**Symptom:** Bot replies "❌ Board unavailable — try again in a moment." consistently. Both the board and agent containers appear healthy in Dokploy.

**Root cause:** Docker's internal DNS for the `board` hostname is stale. When one service (e.g. the board) is redeployed individually in Dokploy, the container gets a new IP. The agent's DNS still resolves `board` to the old IP, which either belongs to a different container or is unassigned — causing immediate `Connection refused`.

**Confirm it:**
From the agent container terminal in Dokploy:
```sh
python3 -c "import socket; print(socket.gethostbyname('board'))"
```
From the board container terminal:
```sh
hostname -i
```
If the two IPs differ, this is the problem.

**Fix:** In Dokploy, trigger a full redeploy of the entire Docker Compose application (not individual services). This tears down and recreates all containers together, giving them fresh IPs and re-registering DNS correctly.

**Why redeploying one service breaks it:** Docker Compose assigns IPs sequentially when containers join the network. If only the board is redeployed, it re-joins the network and may get a different IP than before. The agent — still running with the old DNS cache — points to the old IP until it is also restarted.
