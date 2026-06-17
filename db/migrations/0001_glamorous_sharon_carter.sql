ALTER TABLE "resources" ADD COLUMN "type" text DEFAULT 'Link' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
-- slug is added nullable here so this migration is safe on already-populated
-- tables. `db/backfill-okf.ts` fills every row's slug, then promotes the column
-- to NOT NULL and adds the unique constraint. Run backfill right after migrate.
ALTER TABLE "resources" ADD COLUMN "slug" text;
