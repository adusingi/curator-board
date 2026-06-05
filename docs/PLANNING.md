# PLANNING.md — Curator Board
*Architecture, phases, and delivery direction*
*Last updated: 2026-06-05*

---

## Project Overview

**Curator Board** is an open-source self-hosted application for collecting links through Telegram and publishing them on a themed public board.

The codebase already contains:

- a public Next.js board
- a resource/category API
- admin editing
- Telegram-based ingestion
- PostgreSQL-backed storage

The current planning focus is:

- remove commercial and internal-only repo material
- keep the public board polished and themeable
- preserve separate human and machine auth
- keep AI categorization provider-agnostic
- document reliable self-hosted deployment paths

---

## Architecture Overview

### Current target architecture

```text
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

```text
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
| **Web framework** | Next.js 16 (App Router) | One app for UI and API routes |
| **Language** | TypeScript strict | Shared language across app and bot |
| **Database** | PostgreSQL 16 | Simple and proven for self-hosted deployments |
| **ORM** | Drizzle ORM | Lightweight and typed |
| **Styling** | Token-based editorial UI with built-in theme palettes | Supports a distinctive but maintainable UI |
| **Bot runtime** | TypeScript / Node.js | Aligned with the web stack |
| **Metadata fetch** | HTTP fetch + HTML parsing | Cheap default path before optional enrichment |
| **AI provider layer** | Provider abstraction over operator-owned keys | Avoids hard dependency on one vendor |
| **Deployment** | Docker Compose plus standalone app/bot paths | Covers the common self-hosted setup modes |

---

## Key Architectural Decisions

### Why open source?
The repo is easier to maintain and collaborate on when public-facing docs, workflows, and structure reflect the actual open-source intent rather than an internal sales process.

### Why self-hosted first?
The current architecture already fits self-hosting cleanly and avoids the complexity of a hosted multi-tenant product.

### Why separate admin auth from bot auth?
`ADMIN_PASSWORD` works well for humans. `BOARD_API_SECRET` remains appropriate for machine-to-machine writes. Keeping them separate reduces confusion and limits secret exposure.

### Why Telegram only in the current release?
Telegram matches the current ingestion shape and keeps the product narrow enough to maintain well.

### Why provider-agnostic AI categorization?
The project should not be tied to one AI vendor. Operators should be able to choose their provider or run without one.

### Why keep metadata enrichment optional?
Default metadata extraction keeps setup simple and cost-free. Optional enrichment improves quality without becoming a hard dependency.

### Why keep Docker Compose?
It remains the clearest path for a single-server deployment with the board, bot, and database together.

---

## Current Planning Phases

### Phase 1 — Open-source cleanup
**Goal:** Make the repository public-ready and remove commercial/internal-only artifacts.

Included:
- rewrite repo docs for open-source positioning
- remove delivery and paid-workflow docs
- remove repo-private deployment automation
- add basic contribution guidance

### Phase 2 — Ingestion hardening
**Goal:** Keep ingestion reliable with or without optional providers.

Included:
- no-provider fallback to `other`
- provider abstraction for AI categorization
- optional rich metadata enrichment path

### Phase 3 — UX and operability
**Goal:** Improve the board experience and deployment ergonomics without widening scope.

Included:
- theme system refinement
- docs quality improvements
- deployment verification improvements

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Docs drift from code | Medium | Medium | Keep README, PRD, planning, and runbook aligned |
| AI provider abstraction grows too broad too early | Medium | Medium | Keep the interface narrow and support only needed providers |
| Optional enrichment becomes a hard dependency accidentally | Medium | High | Keep fallback behavior covered and documented |
| Public repo exposes internal-only assumptions | Medium | Medium | Remove sales, delivery, and private deployment material |
