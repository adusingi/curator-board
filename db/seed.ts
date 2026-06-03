import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../lib/schema";

const SEEDED_CATEGORIES = [
  { name: "AI & ML", slug: "ai-ml" },
  { name: "Technology", slug: "technology" },
  { name: "Africa", slug: "africa" },
  { name: "Geopolitics & Politics", slug: "geopolitics" },
  { name: "Business & Finance", slug: "business" },
  { name: "Science", slug: "science" },
  { name: "Philosophy & Culture", slug: "philosophy" },
  { name: "Japan", slug: "japan" },
  { name: "Design & UX", slug: "design" },
  { name: "Tools & Products", slug: "tools" },
  { name: "Books & Writing", slug: "books" },
  { name: "Other", slug: "other" },
];

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log("Seeding categories...");
  await db
    .insert(categories)
    .values(SEEDED_CATEGORIES)
    .onConflictDoNothing({ target: categories.slug });
  console.log(`Seeded ${SEEDED_CATEGORIES.length} categories.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
