import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  seeded: boolean("seeded").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
