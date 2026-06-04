# AGENTS.md — Curator Board

Instructions for AI assistants working in this repository.

## Read First

Before starting work, review these files in this order:

1. [`docs/TASKS.md`](/Users/mac3jis/Documents/Code/p/curator-board/docs/TASKS.md) for the next active work item and any follow-ups already recorded.
2. [`docs/PLANNING.md`](/Users/mac3jis/Documents/Code/p/curator-board/docs/PLANNING.md) for architecture, constraints, and phased delivery.
3. [`docs/PRD.md`](/Users/mac3jis/Documents/Code/p/curator-board/docs/PRD.md) for product requirements and scope.
4. [`README.md`](/Users/mac3jis/Documents/Code/p/curator-board/README.md) for repo-facing setup and usage instructions.
5. [`docs/ARCHITECTURE.md`](/Users/mac3jis/Documents/Code/p/curator-board/docs/ARCHITECTURE.md) if it exists. This file should be generated or refreshed with the `architecture` skill when a comprehensive architecture document is needed.

If those files disagree, prefer `PRD.md` for product intent, `PLANNING.md` for implementation direction, and `TASKS.md` for immediate execution tracking.

## Product Context

- This repo is the sellable self-hosted Curator Board product.
- Use `Curator Board` as the product and repo name. Do not introduce or preserve legacy `Resources` naming in product-facing docs, metadata, config defaults, or UI text unless a specific technical identifier still requires it.
- v1 is for technical buyers.
- v1 supports one admin per installed copy.
- Telegram is the only ingestion channel in v1.
- Human admin auth and machine-to-machine auth must remain separate.
- The product must continue to work without an AI provider key by falling back to category `other`.

## Branch Rules

- `development` is the default working branch.
- `main` is a protected release branch and must only move forward from `development`.
- Do not do implementation work directly on `main`.
- If the user asks for feature isolation, branch from `development` using `feat/<name>` or `fix/<name>`.
- Do not delete local or remote branches unless the user explicitly approves it.
- Do not push to `main` without explicit user approval.

## Delivery Rules

- Make the smallest complete change that solves the task.
- Keep changes aligned with the current productization roadmap instead of reopening settled product decisions.
- When you complete work that changes behavior, update the relevant docs in the same task when practical.
- When you finish a coherent feature slice or completed issue, commit it unless the user explicitly asks you not to.
- If the user asks for architecture documentation, use the `architecture` skill to create or refresh [`docs/ARCHITECTURE.md`](/Users/mac3jis/Documents/Code/p/curator-board/docs/ARCHITECTURE.md).
- When you finish a tracked task, mark it complete in [`docs/TASKS.md`](/Users/mac3jis/Documents/Code/p/curator-board/docs/TASKS.md). If you discover additional necessary work, add a follow-up item in the appropriate phase.

## Code Standards

- TypeScript should stay strict. Avoid `any` unless there is a strong, documented reason.
- Validate external inputs at boundaries.
- Keep modules focused and easy to scan.
- As a guideline, prefer files under 300 lines; treat files over 500 lines as refactor candidates when touched materially.
- Avoid browser exposure of machine secrets.
- Prefer explicit server-side auth checks for admin behavior.

## Repo-Specific Guardrails

- Do not reintroduce browser-side entry or storage of `BOARD_API_SECRET` for human admin flows.
- `ADMIN_PASSWORD` is for human login; `BOARD_API_SECRET` is for machine writes.
- Keep AI categorization provider-agnostic.
- Optional enrichment failures must not block ingestion.
- The canonical deployment is a single VPS running the full stack via Docker Compose (board + bot + postgres together).

## Verification

- Run the narrowest relevant checks for the changed area first.
- If you cannot run verification, say so clearly.
- Do not claim a path is production-ready unless the code and docs in this repo support that statement.

## Preferred Task Pattern

1. Confirm the current branch and working tree state.
2. Read the relevant task and implementation files.
3. Make the smallest coherent set of edits.
4. Verify behavior with targeted checks.
5. Update `docs/TASKS.md` and adjacent docs when needed.
6. Summarize changes, verification, and any remaining risk.
