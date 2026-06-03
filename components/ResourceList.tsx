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
    <div style={{ display: "flex", gap: 0, minHeight: "60vh" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: "1px solid #ddd",
          paddingRight: 20,
          marginRight: 32,
        }}
      >
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 10,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#aaa",
            marginBottom: 10,
            marginTop: 2,
          }}
        >
          Filter
        </p>

        <button
          onClick={() => setActive(null)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "5px 0",
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
            fontWeight: active === null ? 700 : 400,
            color: active === null ? "#000" : "#555",
            borderLeft: active === null ? "2px solid #000" : "2px solid transparent",
            paddingLeft: 8,
          }}
        >
          All{" "}
          <span style={{ color: "#aaa", fontSize: 11 }}>({items.length})</span>
        </button>

        {populated.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActive(c.slug === active ? null : c.slug)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "5px 0",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              fontWeight: active === c.slug ? 700 : 400,
              color: active === c.slug ? "#000" : "#555",
              borderLeft: active === c.slug ? "2px solid #000" : "2px solid transparent",
              paddingLeft: 8,
            }}
          >
            {c.name}{" "}
            <span style={{ color: "#aaa", fontSize: 11 }}>({counts[c.slug]})</span>
          </button>
        ))}
      </aside>

      {/* ── Main list ── */}
      <main style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <p style={{ fontFamily: "system-ui, sans-serif", color: "#aaa", fontSize: 13 }}>
            No resources yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filtered.map((r) => (
              <article key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {/* Arrow */}
                <span
                  style={{
                    color: "#bbb",
                    flexShrink: 0,
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 12,
                    paddingTop: 3,
                    width: 16,
                  }}
                >
                  →
                </span>

                <div style={{ flex: 1 }}>
                  {/* Title row */}
                  <div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 15,
                        fontStyle: "italic",
                        color: "#1a1a1a",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {r.title}
                    </a>
                    {"  "}
                    <span
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        fontSize: 11,
                        color: "#aaa",
                      }}
                    >
                      ({getDomain(r.url)})
                    </span>
                  </div>

                  {/* Description */}
                  {r.description && (
                    <p
                      style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 13,
                        color: "#666",
                        margin: "4px 0 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {r.description.length > 360 ? r.description.slice(0, 357) + "..." : r.description}
                    </p>
                  )}

                  {/* Meta row: category · date · share */}
                  <div
                    style={{
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "system-ui, sans-serif",
                      fontSize: 11,
                      color: "#aaa",
                    }}
                  >
                    <span
                      style={{
                        background: "#f0f0f0",
                        color: "#666",
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontSize: 10,
                        letterSpacing: 0.3,
                      }}
                    >
                      {r.category.name}
                    </span>
                    <span>{formatDate(r.createdAt)}</span>
                    <span>·</span>
                    <button
                      onClick={() => share(r.url, r.title)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#aaa",
                        fontSize: 11,
                        padding: 0,
                        fontFamily: "system-ui, sans-serif",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#333")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
                    >
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
