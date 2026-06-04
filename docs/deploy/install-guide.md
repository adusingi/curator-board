# Install Guide

*This guide is for buyers. It walks you through deploying the board and Telegram bot from scratch.*

## What you have

This package contains a self-hosted link curation system:

- A **Next.js web board** — public URL list + admin panel
- A **Telegram bot** — send any URL and it is saved automatically
- A **PostgreSQL database** — all data stays on your infrastructure

## Prerequisites

- Node.js 22+ and pnpm (or Docker — see the Docker path below)
- A Telegram bot token — create one via [@BotFather](https://t.me/BotFather) and get your user ID from [@userinfobot](https://t.me/userinfobot)
- A PostgreSQL database (local, managed, or Docker)

AI categorization is optional. Without an AI key every saved link is assigned to an "other" category. You can add a key later at any time.

## Choose your deployment path

### Path 1 — Vercel + separate bot host (easiest for the board)

Best if you want the board online with zero server management.

1. **Deploy the board to Vercel** — follow `docs/deploy/deploy-vercel.md`. You will need a managed Postgres database (Neon and Supabase both have free tiers).
2. **Run the bot on a VPS or any server** — follow `docs/deploy/deploy-bot.md`. The bot only needs outbound internet access and the URL of your deployed board.

### Path 2 — Docker Compose on a single VPS (everything in one place)

Best if you want one server running everything together.

Follow `docs/deploy/deploy-docker.md`. You will need:
- A VPS with Docker installed (2 GB RAM minimum recommended)
- A domain pointed at the server (for HTTPS)

## Quick-start checklist

- [ ] Database is running and accessible
- [ ] `.env.example` copied to `.env.local` (board) and `agent/.env.example` copied to `agent/.env` (bot)
- [ ] All **required** environment variables filled in (see each env file — required vars are clearly marked)
- [ ] `pnpm db:migrate` run at least once
- [ ] Board is reachable at its public URL
- [ ] Telegram bot is running and responds to a test URL

## Environment variables at a glance

### Board (`.env.local` or Vercel dashboard)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@host/db` |
| `BOARD_API_SECRET` | yes | `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | yes | Password for `/admin` |
| `ADMIN_SESSION_SECRET` | no | Defaults to `BOARD_API_SECRET` |

### Bot (`agent/.env` or container env)

| Variable | Required | Notes |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | From @BotFather |
| `TELEGRAM_OWNER_ID` | yes | Your Telegram numeric user ID |
| `BOARD_API_URL` | yes | Full URL of the deployed board |
| `BOARD_API_SECRET` | yes | Same value as the board |
| `ANTHROPIC_API_KEY` | no | Enables Claude categorization |
| `OPENAI_API_KEY` | no | Enables OpenAI categorization |
| `SUPADATA_API_KEY` | no | Richer metadata for YouTube/social links |

## Accessing the admin panel

Once the board is running, go to `/admin` (e.g. `https://your-domain.com/admin`). Log in with `ADMIN_PASSWORD`. From the admin panel you can:

- Edit or delete any saved resource
- Create and rename categories

## Sending your first link

Open the Telegram bot and send any URL as a plain message. The bot will reply with a confirmation once the link is saved, including which category it was assigned to.

## Troubleshooting

### Bot responds with "Board unavailable"

The bot cannot reach the board. Check that `BOARD_API_URL` points to a running board instance and that the board is healthy.

### Board shows a database error on startup

`DATABASE_URL` is incorrect or the database is not running. Run `pnpm db:migrate` manually and check the output for connection errors.

### Admin login fails with "ADMIN_PASSWORD is not configured"

`ADMIN_PASSWORD` is missing from the board environment. Add it and restart the board.

### All links are saved as "other"

No AI provider key is configured. This is expected behavior — add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to the bot environment and restart it to enable categorization.

## Need help?

Contact: aimabled@gmail.com

Please include your deployment path (Vercel / Docker / manual) and the relevant log output when reporting issues.
