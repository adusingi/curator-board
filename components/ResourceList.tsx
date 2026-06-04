"use client";

import { useState } from "react";
import type { Category, Resource } from "@/lib/schema";

type ResourceWithCategory = Omit<Resource, "categoryId"> & {
  category: Pick<Category, "id" | "name" | "slug">;
};

interface Props {
  items: ResourceWithCategory[];
  categories: Category[];
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

async function share(url: string, title: string) {
  if (navigator.share) {
    await navigator.share({ title, url }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(url).catch(() => {});
  }
}

export default function ResourceList({ items, categories }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const counts: Record<string, number> = {};
  items.forEach((r) => {
    counts[r.category.slug] = (counts[r.category.slug] ?? 0) + 1;
  });

  const populated = categories.filter((c) => counts[c.slug] > 0);
  const filtered = active ? items.filter((r) => r.category.slug === active) : items;

  return (
    <div className="board-layout">
      <aside className="board-sidebar">
        <p className="board-sidebar-label">Filters</p>
        <div className="filter-list">
          <button className="filter-button" data-active={active === null} onClick={() => setActive(null)}>
            <span>All links</span>
            <span className="filter-count">{items.length}</span>
          </button>

          {populated.map((c) => (
            <button
              key={c.slug}
              className="filter-button"
              data-active={active === c.slug}
              onClick={() => setActive(c.slug === active ? null : c.slug)}
            >
              <span>{c.name}</span>
              <span className="filter-count">{counts[c.slug]}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="board-main">
        {filtered.length === 0 ? (
          <p className="link-empty">No links yet.</p>
        ) : (
          <div className="link-list">
            {filtered.map((r) => (
              <article key={r.id} className="link-card">
                <span className="link-arrow">→</span>

                <div className="link-content">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-title"
                  >
                    {r.title}
                  </a>
                  <div className="link-meta">
                    <span className="link-category">{r.category.name}</span>
                    <span>{formatDate(r.createdAt)}</span>
                    <span>·</span>
                    <button onClick={() => share(r.url, r.title)} className="share-button">
                      share
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
