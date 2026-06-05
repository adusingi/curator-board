# Install Guide

*Curator Board setup guide.*

> **Prerequisites:** a Linux server or local machine with Docker, plus SSH access if deploying remotely.

---

## Step 1 — Clone the repository

```bash
git clone <your-fork-or-clone-url> curator-board
cd curator-board
```

If you plan to contribute changes upstream, fork the repository first and clone your fork.

---

## Step 2 — Configure the environment

```bash
cp .env.example .env
```

Open `.env` and fill in every required value. Minimum required values:

| Variable | Notes |
|---|---|
| `POSTGRES_USER` | e.g. `curator_board` |
| `POSTGRES_PASSWORD` | Choose a strong password |
| `POSTGRES_DB` | e.g. `curator_board` |
| `DATABASE_URL` | `postgresql://<user>:<password>@postgres:5432/<db>` |
| `BOARD_API_SECRET` | Generate with `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Password for the `/admin` UI |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_OWNER_ID` | From [@userinfobot](https://t.me/userinfobot) |

Optional values:

- `ADMIN_SESSION_SECRET`
- `AI_PROVIDER`
- `AI_MODEL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `SUPADATA_API_KEY`

---

## Step 3 — Start the full stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Once complete:

```bash
docker compose -f docker-compose.prod.yml ps
```

All three services — `postgres`, `board`, and `agent` — should show as running.

---

## Step 4 — Verify

```bash
curl http://localhost:3000/api/categories
```

Then:

1. Open `http://localhost:3000/admin`
2. Log in with `ADMIN_PASSWORD`
3. Send any URL to your Telegram bot

Expected bot behavior: `⏳ Fetching…` followed by a success or error message.

---

## Step 5 — Optional production setup

For a public deployment, put a reverse proxy in front of the board service and serve HTTPS. See [deploy-docker.md](./deploy-docker.md) for details.

---

## Need help?

Open an issue in the repository with:

- your OS and Docker version
- the relevant command output
- the board or agent logs if applicable
