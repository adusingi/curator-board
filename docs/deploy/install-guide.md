# Install Guide

*This guide is for buyers. It walks you through deploying the full stack on your own server.*

## What you have

This package contains a self-hosted link curation system:

- A **Next.js web board** — public URL list + admin panel
- A **Telegram bot** — send any URL and it is saved automatically
- A **PostgreSQL database** — all data stays on your infrastructure

Everything runs together on a single server using Docker Compose. You own the server, the data, and the code.

**Updates:** when a new version is released, re-download the latest ZIP from your purchase link at no extra cost.

---

## Prerequisites

- A Linux VPS with Docker and Docker Compose v2 installed (2 GB RAM minimum recommended)
- A domain pointed at your server's IP address (for HTTPS)
- A Telegram bot token — create one via [@BotFather](https://t.me/BotFather)
- Your Telegram user ID — get it from [@userinfobot](https://t.me/userinfobot)

AI categorization is optional. Without an AI key every saved link is assigned to the "other" category. You can add a key at any time.

---

## Deployment — three steps

### 1. Configure your environment

Copy the example file and fill in every required value:

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable | Notes |
|---|---|
| `POSTGRES_USER` | Any username, e.g. `curator_board` |
| `POSTGRES_PASSWORD` | Choose a strong password |
| `POSTGRES_DB` | Any database name, e.g. `curator_board` |
| `DATABASE_URL` | Must match: `postgresql://<user>:<password>@postgres:5432/<db>` |
| `BOARD_API_SECRET` | Generate with `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Password for the `/admin` UI |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_OWNER_ID` | Your Telegram numeric user ID |

Optional AI categorization (without these every link goes to "other"):

| Variable | Notes |
|---|---|
| `ANTHROPIC_API_KEY` | Enables Claude categorization |
| `OPENAI_API_KEY` | Enables OpenAI categorization |
| `AI_PROVIDER` | `auto` (default), `anthropic`, `openai`, or `none` |
| `SUPADATA_API_KEY` | Richer metadata for YouTube and social URLs |

### 2. Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This builds the board and bot images, starts all three services (postgres, board, agent), runs database migrations automatically, and seeds the default categories. The bot waits for the board to be healthy before it starts polling Telegram.

Verify everything is running:

```bash
docker compose -f docker-compose.prod.yml ps
```

All three services should show `Up`.

### 3. Set up HTTPS with Caddy

The board runs internally on port 3000. Add Caddy in front of it for HTTPS.

Install Caddy on the server, then create a `Caddyfile` in the repo root:

```
your-domain.com {
    reverse_proxy board:3000
}
```

Add a Caddy service to `docker-compose.prod.yml` so it runs on the same Docker network:

```yaml
  caddy:
    image: caddy:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - board
```

Add to the top-level `volumes` block:
```yaml
  caddy_data:
  caddy_config:
```

Then restart the stack:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Caddy handles SSL certificates automatically via Let's Encrypt.

---

## Verify the deployment

```bash
# Board API responding
curl https://your-domain.com/api/categories

# Admin panel
# Open https://your-domain.com/admin in your browser
# Log in with ADMIN_PASSWORD

# Bot
# Send any URL to your Telegram bot
# Expect: ⏳ Fetching… then ✅ Added to <category>
```

---

## Ongoing operations

### View logs

```bash
docker compose -f docker-compose.prod.yml logs -f board
docker compose -f docker-compose.prod.yml logs -f agent
```

### Update to a new version

```bash
# Download the new ZIP from your purchase link
# Extract and replace the files, then:
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on restart.

### Stop the stack

```bash
docker compose -f docker-compose.prod.yml down
```

---

## Troubleshooting

**Board exits immediately** — check `DATABASE_URL` matches your `POSTGRES_*` values exactly.

**Bot replies "Board unavailable"** — board container may still be starting. Check `docker compose ps` and wait for the board to show healthy.

**Admin login fails** — `ADMIN_PASSWORD` is missing from `.env`. Add it and restart: `docker compose -f docker-compose.prod.yml up -d board`.

**All links saved as "other"** — no AI provider key configured. This is expected. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to `.env` and restart the agent: `docker compose -f docker-compose.prod.yml up -d agent`.

---

## Need help?

Contact: aimabled@gmail.com

Please include your server OS, Docker version, and the relevant log output when reporting issues.
