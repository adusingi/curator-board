# PLANNING.md — Curator Board Self-Hosted Product
*Architecture, Phases, and Strategic Decisions*
*Last updated: 2026-06-03*

---

## Project Overview

**Curator Board** is being repositioned from a personal curation tool into a sellable self-hosted source-code product for technical buyers.

The current repo already contains the core product shape:
- a public Next.js board
- a resource/category API
- admin editing
- Telegram-based ingestion
- PostgreSQL-backed storage

The next phase is productization:
- remove prototype leftovers
- redesign the public board into a product-quality themed interface
- replace browser-side admin secret entry with proper admin login
- separate human auth from machine auth
- make AI categorization provider-agnostic
- rewrite the Telegram bot to TypeScript/Node.js
- package the app with deployable installation paths

---

## Architecture Overview

### Current target architecture

```
Telegram
   ↓
Bot Runtime (TypeScript / Node.js)
   │ fetch metadata
   │ optional rich social/video enrichment
   │ optional AI provider categorization
   │ fallback to "other" when no AI key is configured
   │ POST /api/resources (BOARD_API_SECRET)
   ↓
Board App (Next.js)
   │ public site
   │ token-based multi-theme UI
   │ admin login + session auth
   │ GET /api/resources
   │ GET /api/categories
   │ machine-protected write routes
   ↓
PostgreSQL
```

### Human vs machine auth

```
Admin user
   ↓ login with ADMIN_PASSWORD
Session cookie
   ↓
Admin UI + admin mutations

Bot runtime
   ↓ x-api-key: BOARD_API_SECRET
Write API routes
```

---

## Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Web framework** | Next.js 16 (App Router) | One app for UI and API routes, already working |
| **Language** | TypeScript strict | Product direction is Node/TypeScript-first |
| **Database** | PostgreSQL 16 | Simple and proven for self-hosted buyers |
| **ORM** | Drizzle ORM | Lightweight, typed, already in use |
| **Styling** | Token-based editorial UI with built-in theme palettes | A distinct, themeable interface is part of the v1 product value for technical buyers |
| **Bot runtime** | TypeScript / Node.js | Aligns with the web stack and easier product packaging |
| **Metadata fetch** | HTTP fetch + HTML parsing | Cheap default path before optional enrichment |
| **AI provider layer** | Provider abstraction over buyer-owned keys | Removes hard dependency on one vendor |
| **Deployment** | Vercel-friendly web path + separate bot runtime + Docker Compose | Fits technical buyers with different preferences |

---

## Current Repo Structure

```
curator-board/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── admin/
│   └── api/
│       ├── resources/
│       └── categories/
├── components/
│   └── ResourceList.tsx
├── lib/
│   ├── db.ts
│   ├── schema.ts
│   └── board-api-auth.ts
├── db/
│   ├── migrate.ts
│   ├── seed.ts
│   └── migrations/
├── agent/                      # legacy Python bot to be replaced
├── docs/
│   ├── PRD.md
│   ├── PLANNING.md
│   ├── TASKS.md
│   ├── RUNBOOK.md
│   └── adr/
├── docker-compose.yml
├── docker-compose.prod.yml
└── Dockerfile
```

---

## Key Architectural Decisions

### Why self-hosted source-code product first?
It matches the current architecture and dramatically reduces the complexity compared with building a multi-tenant SaaS. Buyers manage their own stack, which makes one-time payment commercially viable.

### Why technical buyers first?
Non-technical self-hosted buyers are not realistic for a first version. Technical buyers can tolerate deployment steps, env vars, and separate runtimes, provided the docs are clear.

### Why separate admin auth from bot auth?
The current browser-side `BOARD_API_SECRET` flow is acceptable for a prototype but weak for a product. A single admin password with session login is much simpler for humans. `BOARD_API_SECRET` remains appropriate for machine-to-machine writes.

### Why Telegram only in v1?
Telegram is the simplest ingestion channel for the current product shape. WhatsApp introduces business onboarding and more integration complexity than is justified for the first sellable version.

### Why rewrite the bot to TypeScript/Node.js?
The current Python bot works, but a mixed runtime makes the product harder to sell and support. A TypeScript/Node bot gives one primary language stack, easier shared logic, and a better fit with a Vercel-oriented packaging story.

### Why provider-agnostic AI categorization?
The current Anthropic-only setup is too narrow for a product. Buyers should be able to bring their own AI keys. The product should work with no AI key at all by falling back to `other`.

### Why keep metadata enrichment optional?
Plain metadata extraction keeps setup simple and cost-free. Optional enrichment improves quality for social/video links without making external services mandatory.

### Why keep Docker even with a Vercel-friendly path?
Some technical buyers will prefer a single full-stack self-hosted deployment. Docker Compose remains the clearest path for that audience.

### Why include themes in v1?
This buyer segment cares about taste, customization, and terminal-adjacent aesthetics. A built-in multi-theme system makes the product feel intentional and "ownable" without requiring buyers to fork CSS on day one.

---

## Phase Breakdown

### Phase 1 — Cleanup and Documentation
**Goal:** Make the repo look like a product instead of a prototype.

Included:
- remove prototype-only code
- remove dead demo paths
- simplify repeated auth helper logic
- align docs with the actual product direction
- introduce a token-based styling foundation
- add a keyboard-friendly built-in theme picker
- ship a small curated set of dark and light themes

### Phase 2 — Admin and Auth Productization
**Goal:** Replace prototype admin auth with a real product-ready admin flow.

Included:
- `ADMIN_PASSWORD`
- login route and session cookie
- admin route protection
- resource editing through authenticated admin
- category create/edit through authenticated admin

### Phase 3 — Ingestion Platform
**Goal:** Make ingestion reliable and configurable for buyers.

Included:
- no-provider fallback to `other`
- provider abstraction for AI categorization
- optional rich metadata enrichment path

### Phase 4 — Bot Rewrite
**Goal:** Move the ingestion runtime to TypeScript/Node.js.

Included:
- TypeScript/Node Telegram bot
- integration with current write APIs
- migration away from the legacy Python bot

### Phase 5 — Packaging and Delivery
**Goal:** Make the product deployable and sellable.

Included:
- Vercel-friendly web deployment guide
- separate bot deployment guide
- verified Docker full-stack path
- manual delivery checklist and package definition

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Admin auth rewrite breaks current admin flow | Medium | Medium | Land login/session slice first and verify manually |
| AI provider abstraction grows too broad too early | Medium | Medium | Start with a narrow interface and only implement required providers |
| Node bot rewrite takes longer than expected | Medium | High | Keep the rewrite scoped to parity with current Telegram workflow |
| Vercel story is oversold while bot still needs a second runtime | High | Medium | Document it honestly as web on Vercel plus separate bot deploy |
| Product docs drift from code | Medium | Medium | Keep PRD, PLANNING, TASKS, and RUNBOOK updated together |
| Theme work expands into open-ended visual polish | Medium | Medium | Keep v1 scope to token refactor, persistent picker, and a curated starter theme set |

---

## Dedicated Repo Decision

Recommended direction:

- Keep a **dedicated product repository** for the sellable codebase
- Keep your own deployed instance, private config, branding, and experimental changes out of that core product repo where possible

Practical interpretation for this project:

- This repo can become the product repo if you remove personal/instance-specific drift
- Your own production deployment details can live in private env/config or a separate thin deploy repo

Why:
- product docs, packaging, and licensing become cleaner
- buyer-facing code stays focused
- your own experiments do not automatically become product commitments
- customer support becomes easier because there is one canonical product codebase

If you are preparing to sell this soon, separating the product from your personal instance is the right move.
