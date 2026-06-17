/**
 * Pure rendering helpers that turn stored OKF concepts into OKF v0.1 markdown.
 * Concepts (links) carry a `type` in frontmatter; index.md and log.md are
 * reserved navigation files and are NOT concepts (no `type`). Links are
 * bundle-root-relative, e.g. `/technology/index.md`.
 */

export type RenderCategory = { name: string; slug: string };

export type RenderLink = {
  url: string;
  title: string;
  description: string | null;
  type: string;
  tags: string[];
  slug: string;
  createdAt: string;
  category: RenderCategory;
};

/** File name for a link concept — the stable slug is the basename. */
export function linkFileName(link: RenderLink): string {
  return `${link.slug}.md`;
}

/** Emit a YAML scalar safely by double-quoting via JSON (valid YAML). */
function yamlString(value: string): string {
  return JSON.stringify(value);
}

/** Emit a YAML flow sequence of strings, e.g. ["a", "b"]. */
function yamlStringArray(values: string[]): string {
  return `[${values.map(yamlString).join(", ")}]`;
}

/** Collapse a (possibly multi-line) description to a one-line frontmatter value. */
function oneLine(value: string, max = 160): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** Render a single link as an OKF concept file. */
export function renderLinkConcept(link: RenderLink): string {
  const fm: string[] = ["---", `type: ${link.type}`, `title: ${yamlString(link.title)}`];
  if (link.description) {
    fm.push(`description: ${yamlString(oneLine(link.description))}`);
  }
  fm.push(`resource: ${yamlString(link.url)}`);
  fm.push(`category: ${yamlString(link.category.slug)}`);
  fm.push(`tags: ${yamlStringArray(link.tags)}`);
  fm.push(`slug: ${yamlString(link.slug)}`);
  fm.push(`timestamp: ${link.createdAt}`);
  fm.push("---");

  const body: string[] = ["", `# ${link.title}`, "", `<${link.url}>`, ""];
  if (link.description) {
    body.push(link.description.trim(), "");
  }
  body.push(`**Category:** [${link.category.name}](/${link.category.slug}/index.md)`, "");

  return `${fm.join("\n")}\n${body.join("\n")}`;
}

/** Render a category's `index.md` (navigation, not a concept). */
export function renderCategoryIndex(category: RenderCategory, links: RenderLink[]): string {
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
  sourceLabel: string,
  generatedAt: string,
  populated: { category: RenderCategory; count: number }[],
  totalLinks: number,
): string {
  const lines: string[] = [
    "# Curator Board — Knowledge Bundle",
    "",
    `OKF v0.1 bundle of curated links from ${sourceLabel}. ` +
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
