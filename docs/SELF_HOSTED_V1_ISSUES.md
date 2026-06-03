# Self-Hosted V1 Issue Breakdown

Source: [SELF_HOSTED_V1_PRD.md](./SELF_HOSTED_V1_PRD.md)

## 1. Admin login replaces browser API secret

Type: `AFK`

## What to build

Replace the current admin unlock flow with a real human login based on a single `ADMIN_PASSWORD`. The admin interface should use a server-side login flow and session cookie so the curator can access admin functionality without pasting `BOARD_API_SECRET` into the browser.

This slice should deliver a complete end-to-end admin login experience and protect the admin surface behind authenticated sessions.

## Acceptance criteria

- [ ] The admin UI no longer asks the user to paste `BOARD_API_SECRET`
- [ ] A curator can log in with `ADMIN_PASSWORD` and access the admin interface
- [ ] Admin routes and mutations are protected by session auth rather than browser-supplied API secrets

## Blocked by

None - can start immediately

## User stories covered

- 9
- 13

---

## 2. Ingestion works without AI provider keys

Type: `AFK`

## What to build

Ensure link ingestion still succeeds when no AI provider key is configured. In that case, the ingestion flow should save the resource and assign it to category `other` instead of failing.

This slice should cover both runtime behavior and setup expectations so buyers understand that AI configuration is optional.

## Acceptance criteria

- [ ] Ingestion succeeds when no AI provider key is configured
- [ ] Resources created without AI categorization are assigned to `other`
- [ ] Setup docs clearly distinguish required secrets from optional AI configuration

## Blocked by

None - can start immediately

## User stories covered

- 6
- 14

---

## 3. Admin can create and edit categories

Type: `AFK`

## What to build

Extend the authenticated admin interface so the curator can create new categories and edit existing categories through the web UI. This should include validation, persistence, and a clear interaction model that fits the existing admin workflow.

## Acceptance criteria

- [ ] An authenticated admin can create a category from the admin UI
- [ ] An authenticated admin can edit an existing category from the admin UI
- [ ] Category validation errors are surfaced clearly in the admin flow

## Blocked by

- Issue 1: Admin login replaces browser API secret

## User stories covered

- 11
- 12

---

## 4. Bot and admin auth are separated clearly

Type: `AFK`

## What to build

Complete the split between human and machine authentication. Human admin actions should use session auth, while machine clients such as the Telegram bot should continue using `BOARD_API_SECRET`.

This slice should also align environment examples and docs so buyers can understand the difference between admin credentials and bot credentials.

## Acceptance criteria

- [ ] Human admin access uses session auth exclusively
- [ ] Machine write access continues to work with `BOARD_API_SECRET`
- [ ] Environment examples and docs clearly explain the two auth paths

## Blocked by

- Issue 1: Admin login replaces browser API secret

## User stories covered

- 13
- 14

---

## 5. Pluggable AI categorization provider selection

Type: `AFK`

## What to build

Introduce a provider abstraction for categorization so the buyer can configure which AI provider to use without changing the ingestion contract. The system should be structured to support multiple providers over time rather than being hard-wired to Anthropic.

This slice should preserve the no-provider fallback behavior from the earlier ingestion slice.

## Acceptance criteria

- [ ] Categorization provider selection is configuration-driven
- [ ] The categorization interface is no longer coupled to a single provider implementation
- [ ] The no-provider fallback remains intact

## Blocked by

- Issue 2: Ingestion works without AI provider keys

## User stories covered

- 7

---

## 6. Optional rich social/video metadata enrichment

Type: `AFK`

## What to build

Keep default scraping simple while supporting an optional richer metadata path for social and video links. When enrichment is configured, the app should use it; when it is absent or fails, ingestion should still continue with the default metadata path.

## Acceptance criteria

- [ ] Default metadata extraction still works without enrichment keys
- [ ] Optional enrichment can improve metadata for supported links
- [ ] Enrichment failures fall back gracefully without blocking ingestion

## Blocked by

- Issue 2: Ingestion works without AI provider keys

## User stories covered

- 8

---

## 7. Telegram bot rewritten in TypeScript/Node

Type: `AFK`

## What to build

Replace the current Python Telegram bot with a TypeScript/Node implementation that preserves the core capture experience and uses the updated ingestion flow. The resulting runtime should fit the product’s Vercel-friendly and Node-first packaging story better than the current mixed-language stack.

## Acceptance criteria

- [ ] Telegram link capture works end-to-end through the new TypeScript/Node bot
- [ ] The new bot integrates with the current ingestion and write APIs
- [ ] The product no longer depends on the Python bot for the main v1 workflow

## Blocked by

- Issue 2: Ingestion works without AI provider keys
- Issue 5: Pluggable AI categorization provider selection
- Issue 6: Optional rich social/video metadata enrichment

## User stories covered

- 4
- 5

---

## 8. Vercel-friendly web deployment guide

Type: `AFK`

## What to build

Create a verified install path for deploying the web app in a Vercel-friendly way. This should document the required environment variables, the expected database setup, and how admin login fits into the deployed product.

## Acceptance criteria

- [ ] The web deployment guide is complete enough for a technical buyer to follow
- [ ] Required environment variables are documented clearly
- [ ] The documented deployment path has been sanity-checked against the current app

## Blocked by

- Issue 4: Bot and admin auth are separated clearly

## User stories covered

- 2
- 3
- 14

---

## 9. Separate bot deployment guide for technical buyers

Type: `AFK`

## What to build

Document a simple separate deployment path for the TypeScript/Node Telegram bot so buyers can run the bot independently from the web app. The guide should cover the required secrets, runtime expectations, and how it connects to the board API.

## Acceptance criteria

- [ ] The bot deployment guide documents the required runtime and environment variables
- [ ] The guide explains how the bot authenticates to the board API
- [ ] The guide is aligned with the TypeScript/Node bot implementation

## Blocked by

- Issue 7: Telegram bot rewritten in TypeScript/Node

## User stories covered

- 2
- 4
- 14

---

## 10. Full-stack Docker self-hosted path stays supported

Type: `AFK`

## What to build

Keep and verify a full-stack Docker-based installation path for buyers who prefer to run the board, bot, and database together. This slice should ensure the Docker story still matches the new auth model and Node bot runtime.

## Acceptance criteria

- [ ] A Docker-based full-stack deployment path remains documented
- [ ] The Docker setup reflects the new admin and bot auth model
- [ ] The Docker path aligns with the TypeScript/Node bot runtime

## Blocked by

- Issue 4: Bot and admin auth are separated clearly
- Issue 7: Telegram bot rewritten in TypeScript/Node

## User stories covered

- 2
- 15

---

## 11. Commercial delivery package for one-time buyers

Type: `HITL`

## What to build

Prepare the commercial delivery package for one-time buyers, including the installation materials, release packaging, and manual fulfillment checklist. This slice should define what the buyer receives after payment and ensure the material is coherent enough to ship.

This slice remains HITL because licensing, packaging format, and delivery expectations may need owner review.

## Acceptance criteria

- [ ] The delivery package contents are explicitly defined
- [ ] Manual fulfillment steps are documented clearly
- [ ] Buyer-facing install materials are ready for a first sale

## Blocked by

- Issue 8: Vercel-friendly web deployment guide
- Issue 9: Separate bot deployment guide for technical buyers

## User stories covered

- 1
- 2
- 16
