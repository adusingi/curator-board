# Deploying the Telegram Bot

The bot is a long-running Node.js process that polls Telegram. It must run on a host that supports persistent processes — a VPS, a dedicated server, or a container platform. It cannot run on Vercel or other serverless platforms.

## Prerequisites

- A running board (Vercel or Docker — see [deploy-vercel.md](./deploy-vercel.md) or [deploy-docker.md](./deploy-docker.md))
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram user ID (get it from [@userinfobot](https://t.me/userinfobot))

## Option A — Docker Compose (recommended with the full stack)

If you are running the full stack with Docker Compose, the bot is already included. See [deploy-docker.md](./deploy-docker.md).

## Option B — Docker container (standalone, board hosted separately)

Build and run the agent image:

```bash
docker build -f agent/Dockerfile -t curator-board-agent .

docker run -d --name curator-board-agent --restart unless-stopped \
  -e TELEGRAM_BOT_TOKEN="<token>" \
  -e TELEGRAM_OWNER_ID="<your-telegram-id>" \
  -e BOARD_API_URL="https://<your-board-domain>" \
  -e BOARD_API_SECRET="<same-as-board>" \
  -e AI_PROVIDER="auto" \
  -e ANTHROPIC_API_KEY="<optional>" \
  curator-board-agent
```

## Option C — Direct Node.js process

On any server with Node.js 22+ and pnpm installed:

```bash
# Install dependencies
pnpm install --frozen-lockfile --ignore-scripts

# Copy and fill in the env file
cp agent/.env.example agent/.env
# Edit agent/.env with your values

# Start the bot
pnpm agent:start
```

To keep the process running across reboots, use a process manager such as `pm2`:

```bash
npm install -g pm2
pm2 start "pnpm agent:start" --name curator-board-agent
pm2 save
pm2 startup
```

## Environment variables

See [agent/.env.example](../agent/.env.example) for the full reference. The minimum required set:

| Variable | Notes |
|---|---|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_OWNER_ID` | Your Telegram user ID |
| `BOARD_API_URL` | Full URL of the running board (no trailing slash) |
| `BOARD_API_SECRET` | Must match the value set in the board environment |

Optional AI categorization:

| Variable | Notes |
|---|---|
| `AI_PROVIDER` | `auto` (default), `anthropic`, `openai`, or `none` |
| `ANTHROPIC_API_KEY` | Enables Anthropic/Claude categorization |
| `OPENAI_API_KEY` | Enables OpenAI categorization |
| `AI_MODEL` | Override the default model for the selected provider |

Optional metadata enrichment:

| Variable | Notes |
|---|---|
| `SUPADATA_API_KEY` | Richer title/description for YouTube and social URLs |

## Verifying the bot is running

1. Open your bot in Telegram and send any URL.
2. The bot should reply with `⏳ Fetching…` followed by a confirmation or error.
3. Check logs:

```bash
# Docker
docker logs curator-board-agent -f

# pm2
pm2 logs curator-board-agent
```

## Without an AI key

If no AI provider key is configured (or `AI_PROVIDER=none`), the bot still works — every link is assigned to the `other` category. AI categorization is fully optional.
