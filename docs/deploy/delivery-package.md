# V1 Delivery Package Definition

*Internal reference — defines what is delivered to buyers.*

## What the buyer receives

A single ZIP archive (or private repo access) containing:

- Full source code of this repository at the tagged v1 release commit
- A `LICENSE` file at the repo root
- All deployment guides in `docs/deploy/`
- A buyer-facing install guide (`docs/deploy/install-guide.md`)

## What is not included

- Pre-built Docker images (buyers build from source)
- Database backups or pre-seeded data beyond the default seed categories
- Seller API keys, tokens, or credentials of any kind

## Package contents checklist

Before sending a delivery, confirm the following are present and up to date:

- [ ] `LICENSE` file at repo root — confirm `[Your Name]` has been replaced with the actual copyright holder name
- [ ] `README.md` updated with final product name (see RES-PROD-27)
- [ ] `docs/deploy/install-guide.md` — buyer-facing quick-start
- [ ] `docs/deploy/deploy-vercel.md` — Vercel board deployment
- [ ] `docs/deploy/deploy-bot.md` — bot deployment
- [ ] `docs/deploy/deploy-docker.md` — Docker full-stack deployment
- [ ] `.env.example` — board env reference with required/optional split
- [ ] `agent/.env.example` — bot env reference with required/optional split
- [ ] No seller secrets committed to the repo (audit with `git log --all -p | grep -E "sk-|Bearer "`)
- [ ] All TODOs and internal-only notes removed from buyer-visible docs

## Format and delivery mechanism

V1 delivery is manual:

1. Tag the release commit (`git tag v1.0.0`).
2. Export a ZIP of the tagged commit: `git archive v1.0.0 --format=zip -o curator-board-v1.0.0.zip`.
3. Send the ZIP via the method documented in [delivery-checklist.md](./delivery-checklist.md).

## Versioning

- Tag each paid delivery commit as `v<major>.<minor>.<patch>`.
- Include the tag in the delivery email subject and filename.
- Keep a local log of: buyer name, delivery date, version tag, delivery method.
