# PRD.md — Curator Board
*Product Requirements Document*
*Last updated: 2026-06-05*

---

## 1. Product Vision

**Curator Board** is an open-source link-collection app for people who want to capture links privately through Telegram, classify them automatically, and publish them on their own clean web board.

> "Own your curated link board — capture fast, publish clean, host it yourself."

Curator Board is maintained as an open-source self-hosted project rather than a commercial delivery package.

---

## 2. Target Users

### Primary Personas

| Persona | Who | Key Need |
|---|---|---|
| **Self-Hoster** | Developer, researcher, founder, or small technical team | Run and customize the stack without reverse-engineering it |
| **Curator / Admin** | The person collecting and editing links in one installed copy | Fast ingestion, simple admin tools, low-friction setup |
| **Public Reader** | Visitors browsing the published board | Clean list of curated links with category filtering |

---

## 3. Operating Model

### Project shape

- Open-source repository
- Self-hosted deployment
- Community contributions welcome
- Maintainer-supported through optional donations

### Deployment model

- One installed copy per deployment
- One curator/admin per installed copy in the current release
- Operator manages their own database, bot token, admin password, and optional AI provider keys

---

## 4. Core Requirements

### 4.1 Link Ingestion (Telegram First)

- Telegram is the only ingestion channel in the current release
- Curator sends a URL to the bot
- The link is fetched, enriched, categorized, and saved
- The bot confirms the save with the chosen category and title
- Core capture must remain fast and low-friction

### 4.2 Public Website

- Public board shows curated links newest first
- Category filtering is available
- Each entry includes title, source domain, description excerpt, date, category, and share action
- No login is required for public readers
- The public board includes a built-in theme switcher
- Theme selection persists per browser without requiring an account
- The UI uses a token-based theme system so new palettes can be added without rewriting component structure

### 4.3 Admin Workflow

- Admin access uses a single `ADMIN_PASSWORD`
- Admin login is session-based
- Admin can edit resources
- Admin can create categories
- Admin can edit categories
- Admin should not require pasting `BOARD_API_SECRET` into the browser

### 4.4 Machine-to-Machine Writes

- `BOARD_API_SECRET` remains for non-browser write clients
- The Telegram bot authenticates to the board API with this secret
- Human admin auth and machine auth remain clearly separate

### 4.5 AI Categorization

- Operators can bring their own AI provider key
- The categorization layer is provider-agnostic
- The system should remain open to additional providers over time
- If no AI provider key is configured, ingestion must still succeed and assign category `other`

### 4.6 Metadata Extraction

- Default metadata extraction should remain simple and local where possible
- Optional richer social/video enrichment may be enabled with external providers such as Supadata
- Failure in optional enrichment must not block ingestion

### 4.7 Deployment Paths

- Local development path for the web app and bot
- Separate simple deployment path for the Telegram bot
- Full Docker Compose path for operators who want web, bot, and database together

---

## 5. Out of Scope (Current Release)

- WhatsApp ingestion
- Multi-user admin accounts
- Hosted SaaS accounts
- Automatic billing or payments inside the product

---

## 6. Roadmap Themes

| Theme | Scope | Status |
|---|---|---|
| **Repository cleanup** | Remove commercial-only material and keep repo public-ready | Current |
| **Ingestion platform** | AI provider abstraction, no-key fallback, optional enrichment | In progress |
| **Runtime** | TypeScript/Node Telegram bot | Completed |
| **Deployment** | Docker and standalone bot documentation | In progress |
| **Expansion** | Additional ingestion channels, multi-user accounts | Future |

---

## 7. User Stories

1. As a self-hoster, I want a clear installation path, so that I can deploy without reverse-engineering the project.
2. As a self-hoster, I want to run the full stack with Docker Compose, so that setup is straightforward.
3. As a curator, I want to send a Telegram link and have it saved automatically, so that capture stays fast.
4. As a curator, I want ingestion to work even when no AI provider is configured, so that missing keys do not block usage.
5. As a curator, I want optional AI categorization with my own provider key, so that I control quality and cost.
6. As a curator, I want optional richer metadata for social and video links, so that those entries look better.
7. As a curator, I want a simple admin login, so that I do not need to use raw secrets in the browser.
8. As a curator, I want to edit resources in the admin UI, so that I can correct titles, descriptions, and categories.
9. As a curator, I want to create and edit categories in the admin UI, so that taxonomy management is simple.
10. As a self-hoster, I want to switch between built-in themes, so that the board feels personal without immediate code changes.
11. As a self-hoster, I want human admin auth separated from bot auth, so that setup is easier to understand and operate.
12. As a self-hoster, I want required and optional secrets documented clearly, so that setup is predictable.
13. As a contributor, I want the codebase to stay clean and focused, so that customization and maintenance are practical.
