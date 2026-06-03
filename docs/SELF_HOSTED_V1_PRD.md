# Self-Hosted V1 Product PRD

## Problem Statement

The current app works as a personal curation system for one owner, but it is not yet packaged as a sellable product. A buyer should be able to purchase the code once, deploy it themselves, connect their own services, and run a private link-collection workflow without depending on the original author for daily operation.

The current implementation also mixes prototype leftovers, browser-side admin API-secret entry, and a Python bot that does not match the desired long-term product shape.

## Goals

- Turn the project into a sellable self-hosted source-code product for technical buyers.
- Keep the first commercial version narrow enough to ship quickly.
- Make deployment straightforward for buyers using clear install docs and a Vercel-friendly web path.
- Replace the current admin API-secret workflow with a simpler human admin login.
- Keep machine-to-machine auth separate from human admin auth.
- Move the Telegram bot to TypeScript/Node.js.
- Support pluggable AI categorization providers owned by the buyer.
- Ensure ingestion still works when no AI provider key is configured.

## Non-Goals

- Multi-tenant SaaS
- Hosted accounts operated by the seller
- Non-technical self-hosted onboarding
- WhatsApp ingestion in v1
- Automatic digital delivery after payment
- Multi-user admin accounts in v1
- Mandatory AI provider configuration

## Users and Operating Model

### Buyer

A technical buyer who is comfortable deploying code, setting environment variables, and managing third-party API keys.

### Operator

The buyer operates their own installation, database, bot token, and optional AI provider keys.

### Curator

Each installation is assumed to have one curator/admin in v1.

### Commercial Model

- One-time payment
- Manual delivery after Stripe payment
- Source-code license

## User Stories

1. As a technical buyer, I want to buy the codebase once, so that I can self-host and customize it.
2. As a technical buyer, I want a clear install guide, so that I can deploy without reverse-engineering the repo.
3. As a technical buyer, I want an easy web deployment path, so that I can put the board online quickly.
4. As a technical buyer, I want a separate bot deployment path, so that Telegram ingestion is easy to run.
5. As a curator, I want to send a Telegram link and have it saved automatically, so that capture stays fast.
6. As a curator, I want the app to save links even when no AI provider is configured, so that ingestion never blocks on missing keys.
7. As a curator, I want optional AI categorization using my own provider key, so that I can improve classification without relying on a shared vendor account.
8. As a curator, I want optional richer video metadata, so that social and video links can have better titles and descriptions.
9. As a curator, I want a simple admin login, so that I do not need to paste an API secret into the browser.
10. As a curator, I want to edit resources from the admin UI, so that I can correct bad titles or categories.
11. As a curator, I want to create categories from the admin UI, so that I do not need to use raw API calls for simple taxonomy updates.
12. As a curator, I want to edit categories from the admin UI, so that I can evolve the taxonomy after deployment.
13. As a buyer, I want machine-to-machine credentials separated from admin credentials, so that bot setup and admin usage are easier to reason about.
14. As a buyer, I want the product docs to list which secrets are required and which are optional, so that setup is predictable.
15. As a buyer, I want a Docker-based full-stack deployment option, so that I can run everything together if I prefer.
16. As a buyer, I want the source code to be clean and focused, so that customizing it is practical.

## Solution Overview

The product will be sold as a technical self-hosted source-code package with one primary workflow:

1. The buyer deploys the Next.js board and database.
2. The buyer deploys the Telegram bot separately.
3. The buyer configures their own Telegram token, database, admin password, and optional AI provider or Supadata keys.
4. The curator sends links to the Telegram bot.
5. The ingestion pipeline scrapes metadata, optionally enriches social/video links, optionally categorizes with a buyer-selected AI provider, and saves the item.
6. The curator manages resources and categories through the web admin.

The v1 installation story should support:

- Vercel-friendly deployment for the web app
- separate bot deployment instructions
- Docker Compose for buyers who want a full-stack self-hosted path

## Implementation Decisions

### Product shape

- The product is a self-hosted source-code license, not a hosted account.
- The initial audience is technical buyers.
- Each installed copy is optimized for one curator/admin.

### Ingestion channels

- Telegram is the only ingestion channel in v1.
- WhatsApp is deferred to a later phase.

### Bot runtime

- The Telegram bot will be rewritten from Python to TypeScript/Node.js.
- Shared logic should move into reusable TypeScript modules where practical.
- New product logic should not be added to the current Python agent unless needed only for short-lived migration support.

### AI categorization

- The buyer owns their own AI provider key.
- Categorization must support a provider abstraction rather than a single Anthropic-specific implementation.
- The system should be designed to support multiple providers such as OpenAI, Anthropic, Kimi, and DeepSeek.
- If no AI provider key is configured, ingestion must still succeed and assign category `other`.

### Metadata enrichment

- Default metadata extraction should remain simple and local where possible.
- Supadata remains optional for richer social/video metadata.

### Admin auth

- Human admin access will use a single `ADMIN_PASSWORD` in v1.
- Admin access will use a server-side login flow with a session cookie.
- `BOARD_API_SECRET` remains for machine-to-machine writes only, such as the Telegram bot.
- The browser should no longer require the user to paste the board API secret.

### Admin capabilities

- Resource edit and delete stay in admin.
- Category create and category edit must be added to admin.

### Delivery

- Payment is one-time through Stripe.
- Product delivery is manual in v1.
- Automatic download links and repository automation are postponed.

## Delivery and Operations

### Required secrets

- database connection string
- board API secret for the bot
- admin password for human login
- Telegram bot token

### Optional secrets

- AI provider key
- Supadata API key

### Deployment modes

- Web app on Vercel or equivalent Node-compatible hosting
- Bot on a separate simple Node runtime
- Docker Compose for buyers who want everything together

### Support posture

- Docs should assume a technical buyer.
- Buyers should be able to run their own stack without seller-managed infrastructure.

## Testing Decisions

- Test externally visible behavior, not implementation details.
- Prioritize tests for auth boundaries, ingestion fallbacks, category management, and provider selection.
- Admin tests should cover login, session enforcement, and resource/category mutations.
- Ingestion tests should cover:
  - metadata extraction success
  - no-AI fallback to `other`
  - provider configuration selection
  - optional Supadata enrichment path
- Deployment docs should be manually verified against a clean setup flow.

## Risks and Open Questions

- The TypeScript/Node bot rewrite may change deployment assumptions and should be designed deliberately rather than ported line-for-line.
- A Vercel-friendly story is valuable, but the product should not promise single-click full-stack deployment if the bot still requires a second runtime.
- Future multi-user admin support should be postponed unless real buyers ask for team workflows.

## Phased Plan

### Phase 1: Cleanup

- Remove prototype-only code and other dead paths.
- Simplify current auth helpers and repo structure where possible.
- Align docs with the real current app.

### Phase 2: Admin auth and admin UX

- Add admin password login and session auth.
- Remove browser-side API-secret entry.
- Add category create and edit in admin.

### Phase 3: Ingestion architecture

- Define a provider-agnostic categorization interface.
- Add no-provider fallback to `other`.
- Keep optional social/video enrichment support.

### Phase 4: Bot rewrite

- Replace the Python Telegram bot with a TypeScript/Node bot.
- Reuse shared validation and API client logic where it improves maintainability.

### Phase 5: Product packaging

- Write install docs for Vercel-friendly web deployment.
- Write separate bot deployment docs.
- Keep Docker Compose full-stack docs.
- Prepare manual delivery materials for one-time buyers.
