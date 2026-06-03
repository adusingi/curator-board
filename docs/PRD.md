# PRD.md — Curator Board Self-Hosted Product
*Product Requirements Document*
*Last updated: 2026-06-04*

---

## 1. Product Vision

**Curator Board** is a self-hosted link-collection product for technical buyers who want to capture links privately through Telegram, classify them automatically, and publish them on their own clean web board.

> "Own your curated link board — capture fast, publish clean, host it yourself."

The first commercial version is not a hosted SaaS. It is a one-time-purchase source-code product that buyers deploy with their own infrastructure, keys, and branding.

---

## 2. Target Users

### Primary Personas

| Persona | Who | Key Need |
|---|---|---|
| **Technical Buyer** | Developer, indie founder, researcher, consultant, or small technical team | Buy once, self-host, customize if needed |
| **Curator / Admin** | The person collecting and editing links in one installed copy | Fast ingestion, simple admin tools, no auth complexity |
| **Public Reader** | Visitors browsing the published board | Clean list of curated links with category filtering |

---

## 3. Operating Model

### Product shape

- Self-hosted source-code product
- One-time payment
- Manual delivery in v1
- Buyer owns deployment, keys, and data

### Deployment model

- One installed copy per buyer
- One curator/admin per installed copy in v1
- Buyer manages their own database, bot token, admin password, and optional AI provider keys

### Commercial assumptions

- Technical buyers first
- Non-technical hosted offer is deferred
- Multi-tenant SaaS is out of scope

---

## 4. Core Requirements

### 4.1 Link Ingestion (Telegram First)

- Telegram is the only ingestion channel in v1
- Curator sends a URL to the bot
- The link is fetched, enriched, categorized, and saved
- The bot confirms the save with the chosen category and title
- Core capture must remain fast and low-friction

### 4.2 Public Website

- Public board shows curated links newest first
- Category filtering is available
- Each entry includes title, source domain, description excerpt, date, category, and share action
- No login is required for public readers
- The public board includes a built-in theme switcher aimed at technical and design-conscious buyers
- The theme picker should feel keyboard-friendly and deliberate, similar to terminal/theme-centric products rather than a generic settings dropdown
- The initial release should ship with multiple curated dark and light themes
- Theme selection should persist per browser without requiring an account
- The UI should use a token-based theme system so new palettes can be added without rewriting component structure

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
- Human admin auth and machine auth must remain clearly separate

### 4.5 AI Categorization

- Buyers can bring their own AI provider key
- The categorization layer must be provider-agnostic
- The system should be designed to support OpenAI, Anthropic, Kimi, DeepSeek, and similar providers over time
- If no AI provider key is configured, ingestion must still succeed and assign category `other`

### 4.6 Metadata Extraction

- Default metadata extraction should remain simple and local where possible
- Optional richer social/video enrichment may be enabled with external providers such as Supadata
- Failure in optional enrichment must not block ingestion

### 4.7 Deployment Paths

- Vercel-friendly deployment path for the web app
- Separate simple deployment path for the Telegram bot
- Full Docker Compose path for buyers who want web, bot, and database together

---

## 5. Out of Scope (v1)

- WhatsApp ingestion
- Multi-user admin accounts
- Hosted SaaS accounts
- Non-technical self-hosted onboarding
- Automatic download delivery after payment
- Built-in billing automation beyond taking payment

---

## 6. Phase Roadmap

| Phase | Scope | Status |
|---|---|---|
| **1 — Productization** | Cleanup, admin auth, category admin, docs refresh | Current |
| **2 — Ingestion Platform** | AI provider abstraction, no-key fallback, optional enrichment | Planned |
| **3 — Runtime Shift** | Telegram bot rewrite to TypeScript/Node.js | Completed |
| **4 — Packaging** | Vercel path, bot deploy path, Docker verification, delivery package | Planned |
| **5 — Expansion** | WhatsApp, hosted version, multi-user accounts | Future |

---

## 7. User Stories

1. As a technical buyer, I want to buy the code once, so that I can self-host and customize it.
2. As a technical buyer, I want a clear installation path, so that I can deploy without reverse-engineering the project.
3. As a technical buyer, I want an easy Vercel-friendly web deployment, so that I can get the board online quickly.
4. As a technical buyer, I want a separate bot deployment path, so that Telegram ingestion is easy to run.
5. As a curator, I want to send a Telegram link and have it saved automatically, so that capture stays fast.
6. As a curator, I want ingestion to work even when no AI provider is configured, so that missing keys do not block usage.
7. As a curator, I want optional AI categorization with my own provider key, so that I control quality and cost.
8. As a curator, I want optional richer metadata for social and video links, so that those entries look better.
9. As a curator, I want a simple admin login, so that I do not need to use raw secrets in the browser.
10. As a curator, I want to edit resources in the admin UI, so that I can correct titles, descriptions, and categories.
11. As a curator, I want to create categories in the admin UI, so that taxonomy management is simple.
12. As a curator, I want to edit categories in the admin UI, so that I can refine taxonomy after deployment.
13. As a technical buyer, I want to switch between opinionated built-in themes, so that the product feels personal and distinctive without custom coding.
14. As a technical buyer, I want the chosen theme to persist in my browser, so that I do not have to reapply it every visit.
15. As a buyer, I want the public UI to be styled through reusable theme tokens, so that I can add or modify palettes cleanly later.
16. As a buyer, I want human admin auth separated from bot auth, so that setup is easier to understand and operate.
17. As a buyer, I want required and optional secrets documented clearly, so that setup is predictable.
18. As a buyer, I want a Docker-based full-stack option, so that I can deploy everything together if I prefer.
19. As a buyer, I want the codebase to be clean and focused, so that customization is practical.
