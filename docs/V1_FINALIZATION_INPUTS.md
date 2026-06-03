# V1 Finalization Inputs
*Last updated: 2026-06-04*

This file answers a narrow question: what does the agent still need from the repo owner, and what can proceed without further input?

## Short Answer

No immediate user input is required to continue implementation.

The next product work can proceed autonomously:

- preserve optional enrichment behavior while the bot transition continues
- tighten delivery and deployment packaging docs

## Inputs Needed Before V1 Can Be Truthfully Declared Final

These items are not all needed immediately, but they are needed before a full v1 release can be honestly signed off.

### 1. Product identity

- Final product name
- Final public domain and brand text
- Decision on whether any remaining legacy `Resources` / `Infiniwa News` references should be fully removed

Current evidence:

- some product-facing docs and config may still need final naming cleanup
- `README.md` uses `Curator Board`
- newer docs and repo guidance use `Curator Board`

### 2. Runtime secrets for end-to-end verification

Needed for full local or live validation:

- `ADMIN_PASSWORD`
- `BOARD_API_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_OWNER_ID`
- one supported AI provider key if live categorization accuracy must be verified beyond the `other` fallback path

Optional but useful:

- `SUPADATA_API_KEY` for richer metadata verification

### 3. Release and commercial decisions

- License choice
- Delivery package contents
- Buyer-facing install/support/contact text
- Payment and fulfillment workflow, if that is part of the v1 release definition

Current evidence:

- no `LICENSE` file exists at repo root

### 4. Deployment target for live release verification

Needed only if live deployment must be verified by the agent rather than documented or tested locally:

- target hosting environment or server access
- final deployment domain(s)
- final production env var values

## Inputs Not Needed Right Now

The following can be decided by implementation without blocking current progress:

- exact initial theme palette names
- exact visual design of the public board
- detailed admin page layout
- session implementation details
- whether ingestion runs Anthropic, OpenAI, or no provider by default in `auto` mode

## Current Repo Facts Relevant to This Audit

- `/admin/login` now accepts `ADMIN_PASSWORD` and sets a session cookie
- `/admin` now redirects unauthenticated users to the login page
- board writes are protected by `x-api-key` via `BOARD_API_SECRET`
- admin resource edit/delete routes now also accept an authenticated admin session
- admin category create/edit routes now also accept an authenticated admin session
- local board env now documents `DATABASE_URL`, `BOARD_API_SECRET`, and `ADMIN_PASSWORD`
- agent env now documents `AI_PROVIDER`, `AI_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPADATA_API_KEY`, `BOARD_API_URL`, `BOARD_API_SECRET`, and legacy `CLAUDE_MODEL`
- the current bot implementation can ingest with no AI provider configured and will assign `other` in that case
- `docs/RUNBOOK.md` now reflects the self-hosted product direction and distinguishes current auth from target v1 auth
- CI workflows already exist for web lint/build and Node agent type checks

## Verification Notes

- GitHub Actions currently run web lint/build on `development` and `main` branch workflows
- GitHub Actions also run Node agent dependency install plus TypeScript checks
- local `pnpm` verification may still fail in this environment if ignored dependency builds have not been approved, even though CI installs with `--ignore-scripts`

## Practical Operating Conclusion

The agent can continue working without owner input now.

Owner input becomes necessary at the point of:

- final naming cleanup
- live end-to-end verification with real secrets
- release packaging and licensing
