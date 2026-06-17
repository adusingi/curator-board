import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { CategoriesResponseSchema, ResourcesResponseSchema } from "./types";
import type { Category, Resource } from "./types";
import { linkFileName, renderCategoryIndex, renderLinkConcept, renderRootIndex } from "./render";

/**
 * Export all curated links from the public board API into an OKF v0.1 bundle
 * under `knowledge/`. Re-run any time to regenerate the bundle in place.
 *
 * Usage: pnpm okf:export [boardUrl]
 *   boardUrl defaults to $BOARD_PUBLIC_URL or https://news.infiniwa.com
 */

const BOARD_URL = (process.argv[2] ?? process.env.BOARD_PUBLIC_URL ?? "https://news.infiniwa.com").replace(/\/+$/, "");
const OUT_DIR = path.resolve(process.cwd(), "knowledge");

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function loadData(): Promise<{ categories: Category[]; resources: Resource[] }> {
  const [catRaw, resRaw] = await Promise.all([
    fetchJson(`${BOARD_URL}/api/categories?limit=200`),
    fetchJson(`${BOARD_URL}/api/resources?limit=200`),
  ]);
  return {
    categories: CategoriesResponseSchema.parse(catRaw).data,
    resources: ResourcesResponseSchema.parse(resRaw).data,
  };
}

/** Remove previously generated category folders + root index, keep log.md. */
async function clean(categories: Category[]): Promise<void> {
  await rm(path.join(OUT_DIR, "index.md"), { force: true });
  await Promise.all(
    categories.map((c) => rm(path.join(OUT_DIR, c.slug), { recursive: true, force: true })),
  );
}

async function writeBundle(categories: Category[], resources: Resource[], generatedAt: string): Promise<void> {
  const byCategory = new Map<string, Resource[]>();
  for (const r of resources) {
    const list = byCategory.get(r.category.slug) ?? [];
    list.push(r);
    byCategory.set(r.category.slug, list);
  }

  const populated: { category: Category; count: number }[] = [];
  for (const category of categories) {
    const links = byCategory.get(category.slug);
    if (!links || links.length === 0) continue;
    populated.push({ category, count: links.length });

    const dir = path.join(OUT_DIR, category.slug);
    await mkdir(dir, { recursive: true });
    await Promise.all(
      links.map((link) => writeFile(path.join(dir, linkFileName(link)), renderLinkConcept(link))),
    );
    await writeFile(path.join(dir, "index.md"), renderCategoryIndex(category, links));
  }

  await writeFile(
    path.join(OUT_DIR, "index.md"),
    renderRootIndex(BOARD_URL, generatedAt, populated, resources.length),
  );
}

/** Append a dated entry to the bundle change log, creating it if absent. */
async function appendLog(resources: Resource[], categoryCount: number, generatedAt: string): Promise<void> {
  const logPath = path.join(OUT_DIR, "log.md");
  const existing = await readFile(logPath, "utf8").catch(() => "# Change Log\n");
  const entry = `- ${generatedAt} — Exported ${resources.length} link${resources.length === 1 ? "" : "s"} across ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"} from ${BOARD_URL}.`;
  await writeFile(logPath, `${existing.trimEnd()}\n${entry}\n`);
}

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString();
  console.log(`Exporting OKF bundle from ${BOARD_URL} → ${OUT_DIR}`);

  const { categories, resources } = await loadData();
  await mkdir(OUT_DIR, { recursive: true });
  await clean(categories);
  await writeBundle(categories, resources, generatedAt);

  const populatedCount = new Set(resources.map((r) => r.category.slug)).size;
  await appendLog(resources, populatedCount, generatedAt);

  console.log(`Wrote ${resources.length} links across ${populatedCount} categories.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
