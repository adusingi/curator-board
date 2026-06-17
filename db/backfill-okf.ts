import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { conceptSlug } from "../lib/okf/slug";

/**
 * One-time backfill that brings an EXISTING populated `resources` table up to
 * the OKF-native schema. Fresh installs get the columns from the Drizzle
 * migration directly; this script is for databases that already hold links.
 *
 * Idempotent. Run once after `pnpm db:migrate`:
 *   pnpm db:backfill
 */

type Row = { id: number; url: string; title: string; category_slug: string; slug: string | null };

async function main(): Promise<void> {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  try {
    // 1. Ensure OKF columns exist (no-ops if the migration already added them).
    await db.execute(sql`ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'Link'`);
    await db.execute(sql`ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "tags" text[] NOT NULL DEFAULT '{}'`);
    await db.execute(sql`ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "slug" text`);

    // 2. Populate slug + tags for every row that is missing them.
    const rows = await db.execute<Row>(sql`
      SELECT r.id, r.url, r.title, c.slug AS category_slug, r.slug
      FROM "resources" r
      JOIN "categories" c ON c.id = r.category_id
    `);

    let filled = 0;
    for (const row of rows) {
      const slug = row.slug ?? conceptSlug(row.title, row.url);
      await db.execute(sql`
        UPDATE "resources"
        SET "slug" = ${slug},
            "type" = 'Link',
            "tags" = CASE WHEN array_length("tags", 1) IS NULL THEN ARRAY[${row.category_slug}]::text[] ELSE "tags" END
        WHERE "id" = ${row.id}
      `);
      filled += 1;
    }

    // 3. Finalize constraints now that every row has a unique slug.
    await db.execute(sql`ALTER TABLE "resources" ALTER COLUMN "slug" SET NOT NULL`);
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'resources_slug_unique'
        ) THEN
          ALTER TABLE "resources" ADD CONSTRAINT "resources_slug_unique" UNIQUE ("slug");
        END IF;
      END $$;
    `);

    console.log(`Backfilled ${filled} resources with OKF type/tags/slug.`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
