# ARCHITECTURE — Curator Board
*Last updated: 2026-06-03*

---

## 1. PROJECT STRUCTURE

```
curator-board/
├── app/                        # Next.js 16 App Router — pages and API routes
│   ├── api/
│   │   ├── categories/
│   │   │   └── route.ts        # GET + POST /api/categories
│   │   ├── admin/
│   │   │   ├── login/route.ts  # POST /api/admin/login
│   │   │   └── logout/route.ts # POST /api/admin/logout
│   │   └── resources/
│   │       ├── route.ts        # GET + POST /api/resources
│   │       └── [id]/
│   │           └── route.ts    # PATCH + DELETE /api/resources/:id
│   ├── admin/
│   │   ├── login/page.tsx      # Admin login page
│   │   └── page.tsx            # Session-protected admin editor
│   ├── globals.css             # Tailwind base styles
│   ├── layout.tsx              # Root HTML layout + metadata
│   └── page.tsx                # Public homepage (server component)
│
├── components/
│   ├── AdminDashboard.tsx      # Session-backed admin resource editor
│   ├── AdminLoginForm.tsx      # Admin login form
│   └── ResourceList.tsx        # Filterable resource list with share action
│
├── lib/
│   ├── admin-auth.ts           # Admin session and password helpers
│   ├── db.ts                   # Drizzle client singleton
│   ├── schema.ts               # Drizzle table definitions + inferred types
│   └── board-api-auth.ts       # x-api-key header check helper
│
├── db/
│   ├── migrate.ts              # CLI migration runner (tsx)
│   ├── seed.ts                 # Seeds the 12 default categories
│   └── migrations/
│       ├── 0000_concerned_doctor_strange.sql  # Initial schema
│       └── meta/               # Drizzle migration journal + snapshots
│
├── agent/                      # Python 3.11 Telegram bot (separate runtime)
│   ├── main.py                 # Entry point — waits for board, starts polling
│   ├── bot.py                  # Telegram handler registration + command logic
│   ├── parser.py               # OG scraper + Claude category picker
│   ├── api_client.py           # HTTP client for board REST API
│   ├── pyproject.toml          # Python dependencies (uv)
│   ├── uv.lock                 # Locked dependency tree
│   └── Dockerfile              # python:3.11-slim container
│
├── docs/
│   ├── ARCHITECTURE.md         # This file
│   ├── PRD.md                  # Product requirements
│   ├── PLANNING.md             # Implementation phasing
│   ├── TASKS.md                # Active task tracker
│   ├── RUNBOOK.md              # Operational reference
│   ├── HANDOFF.md              # Context handoff document
│   ├── SELF_HOSTED_V1_PRD.md   # Self-hosted product PRD
│   ├── SELF_HOSTED_V1_ISSUES.md # Issue-ready task breakdown
│   └── adr/
│       ├── 0001-seeded-categories-with-llm-picker.md
│       ├── 0002-og-scrape-before-llm.md
│       └── 0003-public-read-api-key-write.md
│
├── .github/workflows/
│   ├── ci.yml                  # Lint + build on development branch / PRs
│   └── deploy.yml              # Lint + build + Dokploy webhook on main
│
├── Dockerfile                  # Multi-stage Next.js production image
├── docker-compose.yml          # Local dev: Postgres only (port 5436)
├── docker-compose.prod.yml     # Production: postgres + board + agent
├── drizzle.config.ts           # Drizzle Kit config (schema path, migrations dir)
├── next.config.ts              # Next.js config — standalone output mode
├── package.json                # Node dependencies + pnpm scripts
├── pnpm-workspace.yaml         # pnpm workspace root
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs           # ESLint (Next.js preset)
├── postcss.config.mjs          # PostCSS for Tailwind v4
├── .env.example                # Environment variable template
├── AGENTS.md                   # Instructions for AI assistants
└── README.md                   # Project overview and quick-start
```

---

## 2. HIGH-LEVEL SYSTEM DIAGRAM

```mermaid
graph TD
    User["User (browser)"]
    Admin["Owner (browser /admin)"]
    TelegramUser["Owner (Telegram)"]
    TelegramAPI["Telegram API"]
    Agent["agent container\nPython bot"]
    Anthropic["Anthropic API\nClaude (haiku)"]
    Supadata["Supadata API\n(optional video metadata)"]
    YTOembed["YouTube oEmbed API\n(no key required)"]
    Board["board container\nNext.js 16"]
    DB["postgres container\nPostgreSQL 16"]

    TelegramUser -->|sends URL| TelegramAPI
    TelegramAPI -->|webhook/polling| Agent
    Agent -->|scrape OG tags| ExternalSite["External URL"]
    Agent -->|optional: richer metadata| Supadata
    Agent -->|YouTube fallback| YTOembed
    Agent -->|pick_category| Anthropic
    Agent -->|POST /api/resources\nx-api-key| Board
    Board -->|Drizzle ORM| DB
    User -->|GET /| Board
    User -->|GET /api/resources\nGET /api/categories| Board
    Admin -->|login with ADMIN_PASSWORD| Board
    Admin -->|PATCH/DELETE /api/resources/:id\nsession cookie| Board
    Board -->|query| DB
```

**Request paths:**

| Path | Auth | Description |
|---|---|---|
| `GET /` | none | Public homepage — server-rendered resource list |
| `GET /api/resources` | none | Paginated resource list; filterable by category or search query |
| `GET /api/categories` | none | Full category list |
| `POST /api/admin/login` | none | Exchange `ADMIN_PASSWORD` for an admin session cookie |
| `POST /api/admin/logout` | session cookie | Clear the admin session cookie |
| `POST /api/resources` | `x-api-key` | Create or upsert a resource (used by agent) |
| `PATCH /api/resources/:id` | `x-api-key` or admin session | Update title, description, or category |
| `DELETE /api/resources/:id` | `x-api-key` or admin session | Remove a resource |
| `POST /api/categories` | `x-api-key` or admin session | Add a new category |
| `/admin/login` | none | Admin login screen |
| `/admin` | admin session | Owner editor for titles and categories |

---

## 3. CORE COMPONENTS

### 3.1 Board (Next.js app)

- **Purpose:** Serves the public curated link list, exposes the REST API, and provides the session-protected `/admin` editor.
- **Framework:** Next.js 16, App Router, React 19, TypeScript 5, Tailwind CSS v4
- **Entry points:**
  - `app/layout.tsx` — root HTML layout
  - `app/page.tsx` — public homepage (server component; fetches directly from DB)
  - `app/admin/login/page.tsx` — admin login page
  - `app/admin/page.tsx` — session-protected admin editor shell
  - `app/api/*/route.ts` — Next.js Route Handlers (API layer)
- **Deployment:** Docker container (`Dockerfile`), multi-stage build, `next build --output standalone`. Runs via `node server.js`. Port 3000.
- **Startup sequence:** `tsx db/migrate.ts && tsx db/seed.ts; node server.js` — migrations and seeding run automatically on every container start.

### 3.2 Agent (Telegram bot)

- **Purpose:** Accepts URLs from the owner via Telegram, enriches them with metadata, asks Claude to pick a category, then writes the resource to the board API.
- **Language/frameworks:** Python 3.11, `python-telegram-bot` ≥21, `httpx`, `BeautifulSoup4`, `anthropic` SDK
- **Entry point:** `agent/main.py` — waits for the board to respond (up to 30 attempts × 10 s), then starts long-polling Telegram.
- **Key modules:**
  - `bot.py` — registers all Telegram command and message handlers
  - `parser.py` — OG scraping pipeline + Claude category picker
  - `api_client.py` — typed HTTP client for all board API calls
- **Deployment:** Docker container (`agent/Dockerfile`), `python:3.11-slim`. Managed by `uv`.

### 3.3 Database access layer

- **Purpose:** Type-safe query interface shared by all API routes and the homepage server component.
- **Libraries:** Drizzle ORM 0.43, `postgres` 3.4 (PostgreSQL wire driver)
- **Key files:**
  - `lib/schema.ts` — table definitions and inferred TypeScript types
  - `lib/db.ts` — singleton Drizzle client
  - `lib/board-api-auth.ts` — shared `x-api-key` guard
  - `drizzle.config.ts` — Drizzle Kit config (schema path, migration output directory)

---

## 4. DATA STORES

### PostgreSQL 16

- **Purpose:** Single source of truth for all curated resources and their categories.
- **Local dev:** Runs in Docker on port 5436 (isolated from other projects on the same machine that use 5432–5435).
- **Production:** Managed as a Docker Compose service (`postgres`) with a named volume for persistence.

#### Table: `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text UNIQUE NOT NULL | Human-readable label, e.g. "AI & ML" |
| `slug` | text UNIQUE NOT NULL | URL-safe key, e.g. "ai-ml" |
| `seeded` | boolean DEFAULT true | `true` = part of the default taxonomy; `false` = added by owner post-deploy |
| `created_at` | timestamptz DEFAULT now() | |

#### Table: `resources`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `url` | text UNIQUE NOT NULL | Source URL; upsert target |
| `title` | text NOT NULL | From OG scraper or Supadata |
| `description` | text | Optional; from OG or Supadata; truncated to 1000 chars |
| `category_id` | integer FK → categories.id | Many-to-one |
| `created_at` | timestamptz DEFAULT now() | |

**Default taxonomy (seeded):** AI & ML, Technology, Africa, Geopolitics & Politics, Business & Finance, Science, Philosophy & Culture, Japan, Design & UX, Tools & Products, Books & Writing, Other.

---

## 5. EXTERNAL INTEGRATIONS

| Service | Purpose | Integration |
|---|---|---|
| **Telegram Bot API** | Receives URL submissions from the owner; delivers bot replies | `python-telegram-bot` library, long-polling |
| **Anthropic API (Claude)** | Picks the best category slug for each submitted resource | `anthropic` Python SDK; model configurable via `CLAUDE_MODEL` env var (default: `claude-haiku-4-5-20251001`) |
| **Supadata API** | Enriches video/social URLs (YouTube, TikTok, Instagram, Twitter/X) with real titles and descriptions | REST GET `https://api.supadata.ai/v1/metadata`; optional — skipped if `SUPADATA_API_KEY` is unset |
| **YouTube oEmbed** | Fallback title + channel name for YouTube URLs when Supadata is unavailable | Unauthenticated REST GET; no API key required |

**Metadata resolution order for social/video URLs:**
1. Supadata (if key present)
2. YouTube oEmbed (YouTube only, no key)
3. Standard OG tag scrape
4. Domain name as title (final fallback)

---

## 6. DEPLOYMENT & INFRASTRUCTURE

### Production environment

- **Platform:** Self-hosted Docker Compose via **Dokploy** (manages containers + Traefik reverse proxy + Let's Encrypt TLS)
- **Public URL:** Final production domain still to be confirmed
- **Compose file:** `docker-compose.prod.yml`

#### Production services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | internal only | Persistent database; health-checked before dependents start |
| `board` | built from `Dockerfile` | 3000 (internal) | Next.js app + API; `HOSTNAME=0.0.0.0` required for Traefik routing |
| `agent` | built from `agent/Dockerfile` | none | Telegram bot; connects to board via `http://board:3000` |

### Next.js Docker build (multi-stage)

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:22-alpine` | Installs Node dependencies (frozen lockfile) |
| `builder` | `node:22-alpine` | Runs `pnpm build` with standalone output |
| `runner` | `node:22-alpine` | Minimal production image; includes `tsx`, migration files, and Drizzle packages needed at runtime |

### CI/CD pipeline

**CI (`ci.yml`)** — triggers on push to `development` or PR to `development`/`main`:
1. Lint (`pnpm lint`)
2. Next.js build (with dummy DB URL and API secret)
3. Python syntax check (`py_compile` on all agent modules)

**Deploy (`deploy.yml`)** — triggers on push to `main`:
1. Same lint + build + agent syntax check as CI
2. Triggers Dokploy webhook (`DOKPLOY_WEBHOOK_URL` secret) to redeploy the full Compose stack

### Branch strategy

- `development` — default working branch; CI runs here
- `main` — protected release branch; triggers production deploy

### Local development

- Only `docker-compose.yml` is used locally (Postgres on port 5436 only)
- Next.js runs via `pnpm dev`; agent runs via `uv run python main.py`

---

## 7. SECURITY CONSIDERATIONS

### Authentication model (ADR-0003)

- **Public read:** All `GET` endpoints are unauthenticated. The curated list and categories are publicly accessible by design.
- **Machine write auth:** `POST`, `PATCH`, and `DELETE` endpoints require `x-api-key: <BOARD_API_SECRET>` header. The secret is a 64-character random hex string generated at deploy time.
- **Admin page auth (current):** `/admin` is a client-side React page. The owner enters `BOARD_API_SECRET` in the browser, which is stored in component state and passed to API calls. This pattern is identified as a known gap — see Phase 1 roadmap.
- **Telegram access control:** The agent checks `TELEGRAM_OWNER_ID` before executing write operations. Only messages from the configured owner ID can add or delete resources.

### Authorization helper

`lib/board-api-auth.ts` — single `hasBoardApiKey(req)` function; called at the top of every mutating route handler before any business logic.

### Transport security

- Production TLS is managed by Dokploy / Traefik (Let's Encrypt). All public traffic is HTTPS.
- Internal Docker network communication (agent → board, board → postgres) is unencrypted but contained within the Docker bridge network.

### Known security gaps (tracked in roadmap)

- `BOARD_API_SECRET` is currently entered and held in browser memory on the `/admin` page. Phase 1 will replace this with an `ADMIN_PASSWORD` + session cookie flow, keeping `BOARD_API_SECRET` server-side only.

---

## 8. DEVELOPMENT & TESTING

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Next.js runtime and build |
| pnpm | latest | Node package manager |
| Docker | any recent | Local PostgreSQL |
| Python | 3.11+ | Telegram agent |
| uv | latest | Python package manager |

### Local setup

```bash
# 1. Start PostgreSQL (port 5436)
docker compose up -d

# 2. Configure environment
cp .env.example .env.local
# Set BOARD_API_SECRET=$(openssl rand -hex 32) in .env.local

# 3. Install Node dependencies
pnpm install --ignore-scripts

# 4. Run migrations and seed categories
pnpm db:migrate
pnpm db:seed

# 5. Start the Next.js dev server
pnpm dev
# → http://localhost:3000

# 6. (Optional) Start the Telegram agent in a second terminal
cd agent
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID, ANTHROPIC_API_KEY, BOARD_API_SECRET
uv sync
uv run python main.py
```

### Key commands

```bash
# Board
pnpm dev           # Hot-reload dev server
pnpm build         # Production build
pnpm lint          # ESLint
pnpm db:migrate    # Apply pending migrations
pnpm db:seed       # Seed/refresh default categories (idempotent)
pnpm db:generate   # Generate migration file after schema changes
pnpm db:studio     # Drizzle Studio at http://localhost:4983

# Agent
cd agent
uv sync
uv run python main.py
```

### Testing

There is no automated test suite currently. CI verifies correctness via:
- `pnpm lint` (ESLint, Next.js preset)
- `pnpm build` (TypeScript compilation + Next.js build)
- `python -m py_compile` (syntax check on all agent modules)

End-to-end verification is done manually by sending a URL to the Telegram bot and checking that it appears on the board.

### Code quality tools

| Tool | Config file | Scope |
|---|---|---|
| ESLint 9 | `eslint.config.mjs` | TypeScript + Next.js rules |
| TypeScript 5 | `tsconfig.json` | Strict mode |
| Tailwind CSS v4 | `postcss.config.mjs` | Utility-first CSS via PostCSS |

---

## 9. FUTURE CONSIDERATIONS

### Active roadmap (from `docs/TASKS.md`)

**Phase 1 — Admin auth productization**
- Replace browser-side `BOARD_API_SECRET` entry with `ADMIN_PASSWORD` + session cookie
- Add session-protected admin pages; remove client-side secret exposure
- Add category create/edit UI

**Phase 2 — Ingestion platform**
- Allow ingestion with no AI provider configured (fall back to `other` category)
- Introduce provider-agnostic categorization interface
- Ensure optional enrichment failures never block resource creation

**Phase 3 — Telegram bot rewrite**
- Rewrite the Python bot in TypeScript/Node.js to unify the runtime and simplify deployment

**Phase 4 — Packaging and delivery**
- Vercel-friendly web deployment guide
- Separate bot deployment guide
- One-time-purchase delivery package with buyer-facing install materials

### Known technical debt

- `README.md` still describes the app as a personal one-owner tool; needs updating to reflect the self-hosted product direction.
- `docs/SELF_HOSTED_V1_PRD.md` and `docs/SELF_HOSTED_V1_ISSUES.md` are working notes; pending decision on whether to merge into canonical docs.
- No automated test suite — all verification is lint + build + manual.

---

## 10. GLOSSARY

| Term | Definition |
|---|---|
| **Board** | The Next.js web application (public site + API). Named for the "curator board" concept. |
| **Agent** | The Python Telegram bot that accepts URLs, enriches them, and writes to the Board API. |
| **Resource** | A single saved link: URL + title + optional description + category. |
| **Category** | A controlled-vocabulary label (e.g. "AI & ML", "Africa") that classifies resources. |
| **Seeded category** | A category inserted by `db/seed.ts` at deploy time. `seeded = true` in the DB. |
| **Slug** | URL-safe ASCII identifier for a category (e.g. `ai-ml`, `geopolitics`). |
| **BOARD_API_SECRET** | Shared 64-char hex secret that authorizes machine write operations via `x-api-key` header. Machine-to-machine auth only. |
| **ADMIN_PASSWORD** | (Planned, Phase 1) Human admin password for session-based browser login. Separate from `BOARD_API_SECRET`. |
| **OG scrape** | Fetching Open Graph meta tags (`og:title`, `og:description`) from a URL using httpx + BeautifulSoup. |
| **Supadata** | Third-party API (`supadata.ai`) that provides richer metadata for YouTube and social URLs. Optional. |
| **Dokploy** | Self-hosted PaaS layer that manages Docker Compose deployments, Traefik routing, and Let's Encrypt certificates. |
| **Standalone output** | Next.js build mode (`output: "standalone"`) that produces a minimal `server.js` runnable without the full `node_modules` tree. |
| **Drizzle** | TypeScript ORM used for schema definition, query building, and migration management. |
| **uv** | Fast Python package and project manager (replaces pip + venv) used to manage the agent's dependencies. |

---

## 11. PROJECT IDENTIFICATION

| Field | Value |
|---|---|
| **Project name** | Curator Board |
| **Repository** | `git@github.com:adusingi/curator-board.git` |
| **Public URL** | Final production domain still to be confirmed |
| **Primary contact** | adusingi (git user) |
| **Last updated** | 2026-06-03 |
