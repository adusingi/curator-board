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
type CategoryDraft = { name: string; slug: string };
type CategoryEditState = Record<number, CategoryDraft>;

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

function createInitialCategoryEdits(categories: Category[]): CategoryEditState {
  const initial: CategoryEditState = {};
  for (const category of categories) {
    initial[category.id] = { name: category.name, slug: category.slug };
  }
  return initial;
}

export default function AdminDashboard({ initialCategories, initialResources }: Props) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [edits, setEdits] = useState<Record<number, EditState>>(() => createInitialEdits(initialResources));
  const [categoryEdits, setCategoryEdits] = useState<CategoryEditState>(() => createInitialCategoryEdits(initialCategories));
  const [newCategory, setNewCategory] = useState<CategoryDraft>({ name: "", slug: "" });
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [savingCategory, setSavingCategory] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);

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
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (!res.ok) { setError(`#${id}: ${data?.error ?? "Save failed"}`); return; }
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  }

  async function remove(id: number) {
    if (!confirm(`Delete resource #${id}?`)) return;
    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setDeleting(null);
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (!res.ok) { setError(`#${id}: ${data?.error ?? "Delete failed"}`); return; }
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  function setField(id: number, field: keyof EditState, value: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function createCategory() {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      setCategoryError("Name and slug are required.");
      return;
    }
    setCreatingCategory(true);
    setCategoryError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.name.trim(), slug: newCategory.slug.trim().toLowerCase() }),
    });
    const data = await res.json().catch(() => null);
    setCreatingCategory(false);
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (!res.ok) { setCategoryError(data?.error ?? "Category create failed."); return; }
    const created = data?.data as Category;
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setCategoryEdits((prev) => ({ ...prev, [created.id]: { name: created.name, slug: created.slug } }));
    setNewCategory({ name: "", slug: "" });
    setCategoryNotice(`Saved: ${created.name}`);
    setTimeout(() => setCategoryNotice(null), 2000);
  }

  function setCategoryField(id: number, field: keyof CategoryDraft, value: string) {
    setCategoryEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveCategory(id: number) {
    const draft = categoryEdits[id];
    if (!draft?.name.trim() || !draft?.slug.trim()) {
      setCategoryError("Name and slug are required.");
      return;
    }
    setSavingCategory(id);
    setCategoryError(null);
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name.trim(), slug: draft.slug.trim().toLowerCase() }),
    });
    const data = await res.json().catch(() => null);
    setSavingCategory(null);
    if (res.status === 401) { window.location.href = "/admin/login"; return; }
    if (!res.ok) { setCategoryError(data?.error ?? `Category #${id} update failed.`); return; }
    const updated = data?.data as Category;
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)),
    );
    setCategoryEdits((prev) => ({ ...prev, [updated.id]: { name: updated.name, slug: updated.slug } }));
    setResources((prev) =>
      prev.map((r) =>
        r.category.id === updated.id
          ? { ...r, category: { id: updated.id, name: updated.name, slug: updated.slug } }
          : r,
      ),
    );
    setEdits((prev) => {
      const next = { ...prev };
      for (const r of resources) {
        if (r.category.id === updated.id && next[r.id]) {
          next[r.id] = { ...next[r.id], categorySlug: updated.slug };
        }
      }
      return next;
    });
    setCategoryNotice(`Saved: ${updated.name}`);
    setTimeout(() => setCategoryNotice(null), 2000);
  }

  return (
    <div className="admin-page">

      <div className="admin-header">
        <h1 className="admin-heading">Admin — {resources.length} links</h1>
        <button className="admin-btn" onClick={logout} disabled={loggingOut}>
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {/* Create category */}
      <section className="admin-section">
        <h2 className="admin-section-title">Create category</h2>
        {categoryError && <p className="admin-error">{categoryError}</p>}
        {categoryNotice && <p className="admin-notice">{categoryNotice}</p>}
        <div className="admin-form-row">
          <label className="admin-label">
            <span>Name</span>
            <input
              className="admin-input"
              value={newCategory.name}
              onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="admin-label">
            <span>Slug</span>
            <input
              className="admin-input"
              value={newCategory.slug}
              onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
            />
          </label>
          <button className="admin-btn admin-btn-primary" onClick={createCategory} disabled={creatingCategory}>
            {creatingCategory ? "Creating…" : "Add"}
          </button>
        </div>
      </section>

      {/* Edit categories */}
      <section className="admin-section">
        <h2 className="admin-section-title">Edit categories</h2>
        {categoryNotice && <p className="admin-notice">{categoryNotice}</p>}
        <div className="admin-category-list">
          {categories.map((cat) => {
            const draft = categoryEdits[cat.id];
            if (!draft) return null;
            const isSaving = savingCategory === cat.id;
            return (
              <div key={cat.id} className="admin-category-row">
                <label className="admin-label">
                  <span>Name</span>
                  <input
                    className="admin-input"
                    value={draft.name}
                    onChange={(e) => setCategoryField(cat.id, "name", e.target.value)}
                  />
                </label>
                <label className="admin-label">
                  <span>Slug</span>
                  <input
                    className="admin-input"
                    value={draft.slug}
                    onChange={(e) => setCategoryField(cat.id, "slug", e.target.value)}
                  />
                </label>
                <button className="admin-btn" onClick={() => saveCategory(cat.id)} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resources table */}
      <section className="admin-section">
        <h2 className="admin-section-title">Links</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th>Title</th>
              <th>Category</th>
              <th></th>
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
                <tr key={r.id}>
                  <td className="admin-td-muted">{r.id}</td>
                  <td>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-link"
                      title={r.url}
                    >
                      {r.url.replace(/^https?:\/\//, "").slice(0, 32)}…
                    </a>
                  </td>
                  <td>
                    <input
                      className="admin-input admin-input-sm"
                      value={e.title}
                      onChange={(ev) => setField(r.id, "title", ev.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="admin-select"
                      value={e.categorySlug}
                      onChange={(ev) => setField(r.id, "categorySlug", ev.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-td-actions">
                    <button
                      className={`admin-btn admin-btn-sm ${wasSaved ? "admin-btn-saved" : ""}`}
                      onClick={() => save(r.id)}
                      disabled={isSaving || isDeleting}
                    >
                      {wasSaved ? "✓" : isSaving ? "…" : "Save"}
                    </button>
                    <button
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => remove(r.id)}
                      disabled={isSaving || isDeleting}
                    >
                      {isDeleting ? "…" : "Del"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
