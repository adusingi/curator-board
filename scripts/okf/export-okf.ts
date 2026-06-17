import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { desc, eq } from "drizzle-orm";
import { resources, categories } from "../../lib/schema";
import {
  linkFileName,
  renderCategoryIndex,
  renderLinkConcept,
  renderRootIndex,
} from "../../lib/okf/render";
import type { RenderCategory, RenderLink } from "../../lib/okf/render";

/**
 * Project the OKF-native `resources` table into an OKF v0.1 bundle under
 * `knowledge/`: one markdown concept per link, grouped by category. The DB rows
 * already carry the OKF fields (type/tags/slug), so this is a pure projection.
 *
 * Usage: pnpm okf:export
 */

const OUT_DIR = path.resolve(process.cwd(), "knowledge");
const SOURCE_LABEL = "the Curator Board database";

async function loadLinks(db: ReturnType<typeof drizzle>): Promise<RenderLink[]> {
  const rows = await db
    .select({
      url: resources.url,
      title: resources.title,
      description: resources.description,
      type: resources.type,
      tags: resources.tags,
      slug: resources.slug,
      createdAt: resources.createdAt,
      category: { name: categories.name, slug: categories.slug },
    })
    .from(resources)
    .innerJoin(categories, eq(resources.categoryId, categories.id))
    .orderBy(desc(resources.createdAt));

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** Remove previously generated category folders + root index, keep log.md. */
async function clean(slugs: string[]): Promise<void> {
  await rm(path.join(OUT_DIR, "index.md"), { force: true });
  await Promise.all(slugs.map((slug) => rm(path.join(OUT_DIR, slug), { recursive: true, force: true })));
}

async function writeBundle(links: RenderLink[], generatedAt: string): Promise<number> {
  const byCategory = new Map<string, { category: RenderCategory; links: RenderLink[] }>();
  for (const link of links) {
    const entry = byCategory.get(link.category.slug) ?? { category: link.category, links: [] };
    entry.links.push(link);
    byCategory.set(link.category.slug, entry);
  }

  await clean([...byCategory.keys()]);

  const populated: { category: RenderCategory; count: number }[] = [];
  for (const { category, links: catLinks } of byCategory.values()) {
    populated.push({ category, count: catLinks.length });
    const dir = path.join(OUT_DIR, category.slug);
    await mkdir(dir, { recursive: true });
    await Promise.all(
      catLinks.map((link) => writeFile(path.join(dir, linkFileName(link)), renderLinkConcept(link))),
    );
    await writeFile(path.join(dir, "index.md"), renderCategoryIndex(category, catLinks));
  }

  await writeFile(
    path.join(OUT_DIR, "index.md"),
    renderRootIndex(SOURCE_LABEL, generatedAt, populated, links.length),
  );
  return populated.length;
}

/** Append a dated entry to the bundle change log, creating it if absent. */
async function appendLog(linkCount: number, categoryCount: number, generatedAt: string): Promise<void> {
  const logPath = path.join(OUT_DIR, "log.md");
  const existing = await readFile(logPath, "utf8").catch(() => "# Change Log\n");
  const entry = `- ${generatedAt} — Exported ${linkCount} link${linkCount === 1 ? "" : "s"} across ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"} from ${SOURCE_LABEL}.`;
  await writeFile(logPath, `${existing.trimEnd()}\n${entry}\n`);
}

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  try {
    console.log(`Exporting OKF bundle → ${OUT_DIR}`);
    const links = await loadLinks(db);
    await mkdir(OUT_DIR, { recursive: true });
    const categoryCount = await writeBundle(links, generatedAt);
    await appendLog(links.length, categoryCount, generatedAt);
    console.log(`Wrote ${links.length} links across ${categoryCount} categories.`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
