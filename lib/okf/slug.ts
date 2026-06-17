import { createHash } from "node:crypto";

/**
 * Zero-dependency slug helpers (no zod) so the DB backfill / migration step can
 * import them without pulling validation libs into the minimal runtime image.
 */

/** Slugify a string for use in a file path / concept id. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** A short, stable hash of the url — keeps slugs unique without a DB id. */
function shortHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 7);
}

/**
 * Stable, unique concept slug: `<title-slug>-<url-hash>`. Deterministic and
 * independent of the database id, so it is identical across environments and
 * doubles as the `.md` file basename.
 */
export function conceptSlug(title: string, url: string): string {
  const base = slugify(title) || "link";
  return `${base}-${shortHash(url)}`;
}
