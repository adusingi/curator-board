# Install Guide

*Curator Board — self-hosted deployment guide for buyers.*

> **Prerequisites:** a Linux VPS with a domain pointed at it and SSH access.

---

## Step 1 — Push the code to a private GitHub repo

Unzip the archive and initialise a git repository:

```bash
unzip curator-board-v1.0.0.zip -d curator-board
cd curator-board
git init
git add .
git commit -m "init"
```

Create a **private** repo on GitHub (no README, no .gitignore), then push:

```bash
git remote add origin git@github.com:<your-username>/curator-board.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Install Docker on your server

SSH into your server, then run:

```bash
curl -fsSL https://get.docker.com | sh
```

---

## Step 3 — Clone and configure

On the server, clone your repo and set up the environment file:

```bash
git clone git@github.com:<your-username>/curator-board.git
cd curator-board
cp .env.example .env
nano .env
```

Fill in every value marked **required** in the file. The minimum set:

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

---

## Step 4 — Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First run takes 3–5 minutes. Once complete:

```bash
docker compose -f docker-compose.prod.yml ps
```

All three services — `postgres`, `board`, `agent` — should show `Up`.

---

## Step 5 — Verify

```bash
# Board API
curl https://your-domain.com/api/categories

# Admin panel
# Open https://your-domain.com/admin — log in with ADMIN_PASSWORD

# Telegram bot
# Send any URL to your bot on Telegram
# Expected: ⏳ Fetching… then ✅ Added to <category>
```

---

## Need help?

Contact: aimabled@gmail.com

Include your server OS, Docker version, and the relevant log output.
