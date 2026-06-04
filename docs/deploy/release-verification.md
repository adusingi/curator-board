# Release Verification

*Run once before the first paid delivery to confirm everything works end-to-end with real credentials.*

## Secrets you need

Collect these before starting. None should be committed to the repo.

| Secret | Where to get it |
|---|---|
| `ADMIN_PASSWORD` | Choose a strong password |
| `BOARD_API_SECRET` | `openssl rand -hex 32` |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_OWNER_ID` | [@userinfobot](https://t.me/userinfobot) |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | Provider dashboard (optional — skip if testing the `other` fallback only) |
| `SUPADATA_API_KEY` | [supadata.ai](https://supadata.ai) (optional) |
| Deployment target | A Linux VPS with Docker installed + a domain |

## Verification steps

### 1. Deploy the full stack

Follow `docs/deploy/install-guide.md`. The single Docker Compose command starts postgres, board, and agent together.

Confirm:

```bash
curl https://<board-url>/api/categories
# Expected: {"success":true,"data":[...]}
```

### 2. Verify admin login

- Go to `https://<board-url>/admin`
- Should redirect to `/admin/login`
- Log in with `ADMIN_PASSWORD`
- Should reach the admin dashboard

### 3. Confirm the bot is running

The bot starts automatically with the stack. Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f agent
```

### 4. Send a test URL

From your Telegram account, send a plain URL to the bot (e.g. `https://example.com`).

Expected bot flow:
1. `⏳ Fetching…`
2. `✅ Added to <category> (#<id>)` — or an error message if something is misconfigured

### 5. Confirm the resource appears on the board

```bash
curl https://<board-url>/api/resources?limit=1
```

### 6. Verify AI categorization (if a provider key is set)

Send a URL with a clear topic (e.g. a GitHub repo or a YouTube video). Confirm it is not assigned to `other` and that the category makes sense.

### 7. Admin edit and delete

- Log in to `/admin`
- Edit the title of the test resource — confirm the change saves
- Delete the test resource — confirm it is removed

## After verification

- [ ] Record the deployment target and date
- [ ] Tag the verified commit as the v1 release: `git tag v1.0.0`
- [ ] Fill in `[Your Name]` in `LICENSE`
- [ ] Generate the delivery ZIP: `git archive v1.0.0 --format=zip -o curator-board-v1.0.0.zip`
- [ ] Run through `docs/deploy/delivery-checklist.md` before sending the first order
