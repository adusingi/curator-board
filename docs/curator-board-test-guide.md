# Phase 4 Test Guide
*Self-hosted productization — release verification run*

---

## Step 1 — Env files ✅

Verified both env examples have clear required/optional sections and no dead provider keys.

```bash
cat .env.example
cat agent/.env.example
```

**Result:** Required vars at top, optional in separate section, DeepSeek/Kimi keys removed from agent file.

---

## Step 2 — Local board smoke test ✅

```bash
docker compose up -d
pnpm install --ignore-scripts
pnpm db:migrate
pnpm db:seed
pnpm dev
curl http://localhost:3000/api/categories
```

**Result:**
```json
{"success":true,"data":[
  {"id":1,"name":"AI & ML","slug":"ai-ml","seeded":true},
  {"id":3,"name":"Africa","slug":"africa","seeded":true},
  {"id":11,"name":"Books & Writing","slug":"books","seeded":true},
  {"id":5,"name":"Business & Finance","slug":"business","seeded":true},
  {"id":9,"name":"Design & UX","slug":"design","seeded":true},
  {"id":4,"name":"Geopolitics & Politics","slug":"geopolitics","seeded":true},
  {"id":8,"name":"Japan","slug":"japan","seeded":true},
  {"id":12,"name":"Other","slug":"other","seeded":true},
  {"id":7,"name":"Philosophy & Culture","slug":"philosophy","seeded":true},
  {"id":6,"name":"Science","slug":"science","seeded":true},
  {"id":2,"name":"Technology","slug":"technology","seeded":true},
  {"id":10,"name":"Tools & Products","slug":"tools","seeded":true}
]}
```

---

## Step 3 — Admin login ✅

- Navigated to `http://localhost:3000/admin`
- Redirected to `/admin/login` ✓
- Logged in with `ADMIN_PASSWORD` ✓
- Admin dashboard loaded ✓

---

## Step 4 — Bot smoke test ✅

```bash
pnpm agent:start
# Sent https://waratlas.org via Telegram
```

**Bot response:** `⏳ Fetching…` → `✅ Added to Other (#3)`

**API confirmation:**
```json
{"success":true,"data":[{
  "id":3,
  "url":"https://waratlas.org",
  "title":"War Atlas — Every Named War in Human History",
  "category":{"slug":"other"}
}]}
```

**Note:** Categorized as `other` — expected since no AI provider key was configured.

---

## Step 5 — Docker full-stack ✅

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

**Result:**
```
curator-board-postgres-1   Up (healthy)
curator-board-board-1      Up
curator-board-agent-1      Up
```

**Board API verified from inside container:**
```bash
docker exec curator-board-board-1 node -e \
  'fetch("http://127.0.0.1:3000/api/categories").then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))'
```
Returned full categories list ✓

**Fixes required during this step:**
- Added `ENV CI=true` to Dockerfile builder stage (pnpm 11 TTY issue)
- Changed `pnpm build` → `node_modules/.bin/next build` (pnpm 11 approved-builds check)
- Moved `onlyBuiltDependencies` from `package.json` to `pnpm-workspace.yaml`

---

## Step 6 — Packaging workflow ⬅ IN PROGRESS

```bash
git tag v1.0.0-test
git archive v1.0.0-test --format=zip -o /tmp/curator-board-test.zip
unzip -l /tmp/curator-board-test.zip | grep -E "LICENSE|install-guide|deploy/"
```

**Expected:** `LICENSE`, `docs/deploy/install-guide.md`, all `docs/deploy/*.md` present.

---

## Step 7 — Install guide read-through ⬜

Open `docs/deploy/install-guide.md` as a buyer would — confirm every command and path matches what was actually run in steps 2–5.

---

## Before v1 ships

- [ ] Replace `[Your Name]` in `LICENSE` with legal name or business name
- [ ] Vercel test (RES-PROD-20) — needs a live Vercel project + managed DB
- [ ] Set up a Gumroad product page and update the delivery email template with the real link
