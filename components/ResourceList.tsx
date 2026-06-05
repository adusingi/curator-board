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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const counts: Record<string, number> = {};
  items.forEach((r) => {
    counts[r.category.slug] = (counts[r.category.slug] ?? 0) + 1;
  });

  const populated = categories.filter((c) => counts[c.slug] > 0);
  const filtered = active ? items.filter((r) => r.category.slug === active) : items;
  const activeLabel = active ? (categories.find((c) => c.slug === active)?.name ?? "Filters") : "All links";

  function selectCategory(slug: string | null) {
    setActive(slug);
    setSidebarOpen(false);
  }

  return (
    <div className="board-layout">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-expanded={sidebarOpen}
      >
        <span className="sidebar-toggle-bars" aria-hidden="true">
          {sidebarOpen ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect y="1" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="6.25" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="11.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          )}
        </span>
        <span>{activeLabel}</span>
      </button>

      <aside className="board-sidebar" data-open={sidebarOpen}>
        <p className="board-sidebar-label">Filters</p>
        <div className="filter-list">
          <button className="filter-button" data-active={active === null} onClick={() => selectCategory(null)}>
            <span>All links</span>
            <span className="filter-count">{items.length}</span>
          </button>

          {populated.map((c) => (
            <button
              key={c.slug}
              className="filter-button"
              data-active={active === c.slug}
              onClick={() => selectCategory(c.slug === active ? null : c.slug)}
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
                <div className="link-content">
                  <div className="link-row">
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
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
