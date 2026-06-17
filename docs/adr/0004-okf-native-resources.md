# OKF-native resources

Every resource is a valid [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) (OKF) v0.1 concept. The canonical concept is assembled and validated **before** anything is written to the database, and the `resources` table carries the full concept (`type`, `tags`, `slug` alongside the existing `url`/`title`/`description`/`category`/`createdAt`).

`lib/okf/concept.ts` is the single source of the rule via `buildOkfConcept()` (Zod-validated). The write path (`POST /api/resources`) rejects anything that is not a valid concept with `400` — so nothing non-OKF can enter the DB. The Telegram bot and admin UI both write through this API, so the guarantee holds for every caller without changes to either.

The `knowledge/` markdown bundle is a **projection** of the DB, regenerated with `pnpm okf:export`. The DB is the source of truth, not the files.

## Decision

- `slug = slugify(title) + "-" + shortHash(url)` — deterministic, unique (url is already unique), independent of the DB id, identical across environments, and doubles as the `.md` file basename. Slug and `type` are immutable once created (stable concept id); `tags` default to `[categorySlug]`.
- Schema migration `0001` adds `type`/`tags` (with defaults) and `slug` (nullable, so the migration is safe on already-populated tables). `db/backfill-okf.ts` fills `slug`/`tags` for existing rows, then promotes `slug` to `NOT NULL` + `UNIQUE`. Deploy runs `migrate → backfill → seed`.

## Consequences

- A future search feature can crawl the OKF bundle or query the OKF columns directly.
- `knowledge/` is generated and environment-specific, so it is git-ignored.
- `tags` are auto-derived from the category for now; multi-tagging (AI or manual) is a later extension that needs no schema change.
