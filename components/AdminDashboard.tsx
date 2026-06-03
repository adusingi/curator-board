"use client";

import { useState } from "react";

type Category = { id: number; name: string; slug: string };
type Resource = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  category: Category;
};
type EditState = { title: string; categorySlug: string; description: string };

interface Props {
  initialCategories: Category[];
  initialResources: Resource[];
}

function createInitialEdits(resources: Resource[]): Record<number, EditState> {
  const initial: Record<number, EditState> = {};
  for (const resource of resources) {
    initial[resource.id] = {
      title: resource.title,
      categorySlug: resource.category.slug,
      description: resource.description ?? "",
    };
  }
  return initial;
}

export default function AdminDashboard({ initialCategories, initialResources }: Props) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [categories] = useState<Category[]>(initialCategories);
  const [edits, setEdits] = useState<Record<number, EditState>>(() => createInitialEdits(initialResources));
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/admin/login";
  }

  async function save(id: number) {
    setSaving(id);
    setError(null);
    const { title, categorySlug, description } = edits[id];
    const res = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, categorySlug, description: description || null }),
    });
    const data = await res.json().catch(() => null);
    setSaving(null);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (!res.ok) {
      setError(`#${id}: ${data?.error ?? "Save failed"}`);
      return;
    }

    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  }

  async function remove(id: number) {
    if (!confirm(`Delete resource #${id}?`)) return;

    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/resources/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);
    setDeleting(null);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (!res.ok) {
      setError(`#${id}: ${data?.error ?? "Delete failed"}`);
      return;
    }

    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  function setField(id: number, field: keyof EditState, value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  return (
    <div style={{ padding: "1.5rem", fontFamily: "monospace", fontSize: 13 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Admin — {resources.length} resources</h1>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          style={{ padding: "0.45rem 0.8rem", cursor: loggingOut ? "wait" : "pointer" }}
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
      {error && <p style={{ color: "red", marginBottom: "0.5rem" }}>{error}</p>}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "4px 8px", width: 30 }}>ID</th>
            <th style={{ padding: "4px 8px", width: 200 }}>URL</th>
            <th style={{ padding: "4px 8px" }}>Title</th>
            <th style={{ padding: "4px 8px", width: 160 }}>Category</th>
            <th style={{ padding: "4px 8px", width: 100 }}></th>
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => {
            const e = edits[r.id];
            if (!e) return null;
            const isSaving = saving === r.id;
            const isDeleting = deleting === r.id;
            const wasSaved = saved === r.id;
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "4px 8px", color: "#888" }}>{r.id}</td>
                <td style={{ padding: "4px 8px" }}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#555", textDecoration: "none", fontSize: 11 }}
                    title={r.url}
                  >
                    {r.url.replace(/^https?:\/\//, "").slice(0, 30)}…
                  </a>
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <input
                    value={e.title}
                    onChange={(ev) => setField(r.id, "title", ev.target.value)}
                    style={{ width: "100%", padding: "2px 4px", boxSizing: "border-box" }}
                  />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <select
                    value={e.categorySlug}
                    onChange={(ev) => setField(r.id, "categorySlug", ev.target.value)}
                    style={{ width: "100%", padding: "2px 4px" }}
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => save(r.id)}
                    disabled={isSaving || isDeleting}
                    style={{
                      padding: "2px 8px",
                      cursor: isSaving ? "wait" : "pointer",
                      marginRight: 4,
                      background: wasSaved ? "#4caf50" : undefined,
                      color: wasSaved ? "white" : undefined,
                    }}
                  >
                    {wasSaved ? "✓" : isSaving ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={isSaving || isDeleting}
                    style={{
                      padding: "2px 8px",
                      cursor: isDeleting ? "wait" : "pointer",
                      background: "#e53935",
                      color: "white",
                      border: "none",
                    }}
                  >
                    {isDeleting ? "…" : "Del"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
