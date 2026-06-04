# Docker Full-Stack Deployment

`docker-compose.prod.yml` defines the complete self-hosted stack:

- **postgres** — PostgreSQL 16 (data persisted to a named volume)
- **board** — Next.js web app and REST API
- **agent** — Telegram bot

## Prerequisites

- Docker and Docker Compose v2 on the host
- A domain pointed at the host IP (for HTTPS; see reverse proxy section)
- A Telegram bot token from [@BotFather](https://t.me/BotFather) and your Telegram user ID

## 1. Create the environment file

```bash
cp .env.example .env
```

Open `.env` and fill in every required value. All three services read from this file.

### Required values

| Variable | Notes |
|---|---|
| `POSTGRES_USER` | Postgres username (e.g. `curator_board`) |
| `POSTGRES_PASSWORD` | Postgres password — choose a strong one |
| `POSTGRES_DB` | Database name (e.g. `curator_board`) |
| `DATABASE_URL` | Must match the postgres credentials above: `postgresql://<user>:<password>@postgres:5432/<db>` |
| `BOARD_API_SECRET` | Random hex string — generate with `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Password for the `/admin` UI |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_OWNER_ID` | Your Telegram numeric user ID |

### Optional values

| Variable | Notes |
|---|---|
| `ADMIN_SESSION_SECRET` | Separate cookie-signing secret; defaults to `BOARD_API_SECRET` |
| `AI_PROVIDER` | `auto` (default), `anthropic`, `openai`, or `none` |
| `AI_MODEL` | Model override for the selected provider |
| `ANTHROPIC_API_KEY` | Enables Anthropic/Claude categorization |
| `OPENAI_API_KEY` | Enables OpenAI categorization |
| `SUPADATA_API_KEY` | Richer metadata for YouTube and social URLs |

## 2. Build and start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The board container runs `pnpm db:migrate && pnpm db:seed` automatically before starting. The agent waits for the board to become healthy before polling Telegram.

## 3. Verify the stack is running

```bash
docker compose -f docker-compose.prod.yml ps
```

All three services should show `running`. Confirm the board API is responding:

```bash
curl http://localhost:3000/api/categories
```

## 4. Reverse proxy (HTTPS)

The board service exposes port 3000 internally but does not expose it on the host by default. Add a reverse proxy in front of it to serve HTTPS traffic.

### Caddy (simplest)

Install Caddy on the host, then add a `Caddyfile`:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

To make port 3000 reachable from the host, temporarily add a `ports` entry to the `board` service in `docker-compose.prod.yml` or run Caddy inside the same compose network.

**Recommended approach:** add a Caddy service to `docker-compose.prod.yml` on the same Docker network so it can reach `board:3000` directly without exposing the port to the host:

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
```

`Caddyfile`:

```
your-domain.com {
    reverse_proxy board:3000
}
```

Add `caddy_data` and `caddy_config` to the top-level `volumes` block.

### nginx

Alternatively, configure nginx with an SSL certificate (e.g. from Let's Encrypt via certbot) and proxy to `localhost:3000`.

## 5. Ongoing operations

### View logs

```bash
docker compose -f docker-compose.prod.yml logs -f board
docker compose -f docker-compose.prod.yml logs -f agent
```

### Restart a service

```bash
docker compose -f docker-compose.prod.yml restart board
```

### Update to a new version

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically when the board container restarts.

### Stop the stack

```bash
docker compose -f docker-compose.prod.yml down
```

To also delete the Postgres volume (destroys all data):

```bash
docker compose -f docker-compose.prod.yml down -v
```

## Troubleshooting

### Board container exits immediately

Check board logs for migration errors:

```bash
docker compose -f docker-compose.prod.yml logs board
```

Common cause: `DATABASE_URL` does not match `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`.

### Bot replies with "Board unavailable"

The bot polls the board at `http://board:3000`. Confirm both containers are on the same Docker network and the board is healthy:

```bash
docker compose -f docker-compose.prod.yml ps
```

### Postgres data lost after restart

Confirm the `postgres_data` volume exists and is mounted:

```bash
docker volume ls | grep curator
```
