# Deploying the Board to Vercel

This guide covers deploying the **board web app** to Vercel. The Telegram bot cannot run on Vercel (it requires a persistent process); see [deploy-bot.md](./deploy-bot.md) for bot deployment.

## Prerequisites

- A Vercel account
- A managed PostgreSQL database (Neon, Supabase, Railway, or any Postgres provider that gives you a `postgresql://` connection string)
- The repo pushed to GitHub, GitLab, or Bitbucket

## 1. Provision a Postgres database

Create a database on your chosen provider and copy the connection string. It will look like:

```
postgresql://<user>:<password>@<host>/<db>?sslmode=require
```

Run migrations against it once before the first deploy:

```bash
DATABASE_URL="<your-connection-string>" pnpm db:migrate
DATABASE_URL="<your-connection-string>" pnpm db:seed
```

## 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your Git repository.
2. Vercel will detect Next.js automatically.
3. Leave the build command and output directory at their defaults (`pnpm build` / `.next`).

## 3. Set environment variables

In **Project Settings → Environment Variables**, add:

| Variable | Required | Value |
|---|---|---|
| `DATABASE_URL` | yes | Your managed Postgres connection string |
| `BOARD_API_SECRET` | yes | A random hex string (`openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | yes | A strong admin password |
| `ADMIN_SESSION_SECRET` | no | Separate cookie-signing secret; defaults to `BOARD_API_SECRET` |

Do **not** add `POSTGRES_USER`, `POSTGRES_PASSWORD`, or `POSTGRES_DB` — those are only used by Docker Compose.

## 4. Deploy

Click **Deploy**. Vercel runs `pnpm build` and serves the app.

After the first deployment, confirm the board is live:

```
https://<your-project>.vercel.app/api/categories
```

Should return `{"success":true,"data":[...]}`.

## 5. Custom domain (optional)

In **Project Settings → Domains**, add your domain and follow Vercel's DNS instructions.

## Ongoing migrations

When you merge schema changes, run migrations against production before or immediately after deploying:

```bash
DATABASE_URL="<production-connection-string>" pnpm db:migrate
```

## Notes

### `output: "standalone"` in next.config.ts

The repo ships with `output: "standalone"` to support Docker. Vercel ignores this setting and deploys normally. If you are deploying to Vercel only and never need Docker, you can remove the `output` line from `next.config.ts`.

### The bot

The board exposes a REST API (`/api/resources`, `/api/categories`) that the bot writes to. The bot must run separately — see [deploy-bot.md](./deploy-bot.md).
