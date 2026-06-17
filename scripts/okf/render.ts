import type { Category, Resource } from "./types";

/**
 * Pure rendering helpers that turn board data into OKF (Open Knowledge Format
 * v0.1) markdown. Concepts (links) carry a `type` in frontmatter; index.md and
 * log.md are reserved navigation files and are NOT concepts (no `type`).
 * Links are bundle-root-relative, e.g. `/technology/index.md`.
 */

/** Slugify a string for use in a file path. */
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

/** Stable, unique file name for a link concept: `<title-slug>-<id>.md`. */
export function linkFileName(resource: Resource): string {
  const base = slugify(resource.title) || "link";
  return `${base}-${resource.id}.md`;
}

/** Emit a YAML scalar safely by double-quoting via JSON (valid YAML). */
function yamlString(value: string): string {
  return JSON.stringify(value);
}

/** Collapse a (possibly multi-line) description to a one-line frontmatter value. */
function oneLine(value: string, max = 160): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** Render a single link as an OKF concept file. */
export function renderLinkConcept(resource: Resource): string {
  const fm: string[] = [
    "---",
    "type: Link",
    `title: ${yamlString(resource.title)}`,
  ];
  if (resource.description) {
    fm.push(`description: ${yamlString(oneLine(resource.description))}`);
  }
  fm.push(`resource: ${yamlString(resource.url)}`);
  fm.push(`category: ${yamlString(resource.category.slug)}`);
  fm.push(`tags: [${yamlString(resource.category.slug)}]`);
  fm.push(`timestamp: ${resource.createdAt}`);
  fm.push("---");

  const body: string[] = ["", `# ${resource.title}`, "", `<${resource.url}>`, ""];
  if (resource.description) {
    body.push(resource.description.trim(), "");
  }
  body.push(
    `**Category:** [${resource.category.name}](/${resource.category.slug}/index.md)`,
    "",
  );

  return `${fm.join("\n")}\n${body.join("\n")}`;
}

/** Render a category's `index.md` (navigation, not a concept). */
export function renderCategoryIndex(category: Category, links: Resource[]): string {
  const lines: string[] = [
    `# ${category.name}`,
    "",
    `${links.length} link${links.length === 1 ? "" : "s"} in this category.`,
    "",
  ];
  for (const link of links) {
    lines.push(`- [${link.title}](/${category.slug}/${linkFileName(link)}) — <${link.url}>`);
  }
  lines.push("", "[← All categories](/index.md)", "");
  return lines.join("\n");
}

/** Render the bundle root `index.md` (navigation, not a concept). */
export function renderRootIndex(
  boardUrl: string,
  generatedAt: string,
  populated: { category: Category; count: number }[],
  totalLinks: number,
): string {
  const lines: string[] = [
    "# Curator Board — Knowledge Bundle",
    "",
    `OKF v0.1 bundle of curated links from [${boardUrl}](${boardUrl}). ` +
      "One markdown file per link, grouped into a folder per category.",
    "",
    `_Generated ${generatedAt} — ${totalLinks} link${totalLinks === 1 ? "" : "s"} ` +
      `across ${populated.length} categor${populated.length === 1 ? "y" : "ies"}._`,
    "",
    "## Categories",
    "",
  ];
  for (const { category, count } of populated) {
    lines.push(`- [${category.name}](/${category.slug}/index.md) — ${count} link${count === 1 ? "" : "s"}`);
  }
  lines.push("");
  return lines.join("\n");
}
