"use client";
import { useState, useCallback } from "react";

type Category = { id: number; name: string; slug: string };
type Resource = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  category: Category;
};
type EditState = { title: string; categorySlug: string; description: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [edits, setEdits] = useState<Record<number, EditState>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const [rRes, cRes] = await Promise.all([
      fetch("/api/resources?limit=200"),
      fetch("/api/categories"),
    ]);
    const rData = await rRes.json();
    const cData = await cRes.json();
    setResources(rData.data ?? []);
    setCategories(cData.data ?? []);
    const initial: Record<number, EditState> = {};
    for (const r of rData.data ?? []) {
      initial[r.id] = { title: r.title, categorySlug: r.category.slug, description: r.description ?? "" };
    }
    setEdits(initial);
  }, []);

  function unlock() {
    if (!token.trim()) return;
    setAuthed(true);
    loadData();
  }

  async function save(id: number) {
    setSaving(id);
    setError(null);
    const { title, categorySlug, description } = edits[id];
    const res = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": token },
      body: JSON.stringify({ title, categorySlug, description: description || null }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setError(`#${id}: ${data.error ?? "Save failed"}`);
    } else {
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    }
  }

  async function remove(id: number) {
    if (!confirm(`Delete resource #${id}?`)) return;
    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/resources/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": token },
    });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json();
      setError(`#${id}: ${data.error ?? "Delete failed"}`);
    } else {
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function setField(id: number, field: keyof EditState, value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  if (!authed) {
    return (
      <div style={{ padding: "2rem", maxWidth: 400, margin: "80px auto", fontFamily: "monospace" }}>
        <h1 style={{ marginBottom: "1rem" }}>Admin</h1>
        <input
          type="password"
          placeholder="API key"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", boxSizing: "border-box" }}
          autoFocus
        />
        <button onClick={unlock} style={{ padding: "0.5rem 1rem" }}>
          Unlock
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ marginBottom: "1rem" }}>Admin — {resources.length} resources</h1>
      {error && (
        <p style={{ color: "red", marginBottom: "0.5rem" }}>{error}</p>
      )}
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
                  <a href={r.url} target="_blank" rel="noreferrer"
                    style={{ color: "#555", textDecoration: "none", fontSize: 11 }}
                    title={r.url}>
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
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => save(r.id)}
                    disabled={isSaving || isDeleting}
                    style={{ padding: "2px 8px", cursor: isSaving ? "wait" : "pointer", marginRight: 4,
                      background: wasSaved ? "#4caf50" : undefined, color: wasSaved ? "white" : undefined }}
                  >
                    {wasSaved ? "✓" : isSaving ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={isSaving || isDeleting}
                    style={{ padding: "2px 8px", cursor: isDeleting ? "wait" : "pointer",
                      background: "#e53935", color: "white", border: "none" }}
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
