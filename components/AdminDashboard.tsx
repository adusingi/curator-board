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
    initial[category.id] = {
      name: category.name,
      slug: category.slug,
    };
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

  function setCategoryDraft(field: keyof CategoryDraft, value: string) {
    setNewCategory((prev) => ({ ...prev, [field]: value }));
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
      body: JSON.stringify({
        name: newCategory.name.trim(),
        slug: newCategory.slug.trim().toLowerCase(),
      }),
    });
    const data = await res.json().catch(() => null);
    setCreatingCategory(false);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (!res.ok) {
      setCategoryError(data?.error ?? "Category create failed.");
      return;
    }

    const created = data?.data as Category;
    setCategories((prev) => [...prev, created].sort((left, right) => left.name.localeCompare(right.name)));
    setCategoryEdits((prev) => ({
      ...prev,
      [created.id]: { name: created.name, slug: created.slug },
    }));
    setNewCategory({ name: "", slug: "" });
    setCategoryNotice(`Saved category: ${created.name}`);
    setTimeout(() => setCategoryNotice(null), 2000);
  }

  function setCategoryField(id: number, field: keyof CategoryDraft, value: string) {
    setCategoryEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveCategory(id: number) {
    const draft = categoryEdits[id];
    if (!draft?.name.trim() || !draft?.slug.trim()) {
      setCategoryError("Category name and slug are required.");
      return;
    }

    setSavingCategory(id);
    setCategoryError(null);

    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        slug: draft.slug.trim().toLowerCase(),
      }),
    });
    const data = await res.json().catch(() => null);
    setSavingCategory(null);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (!res.ok) {
      setCategoryError(data?.error ?? `Category #${id} update failed.`);
      return;
    }

    const updated = data?.data as Category;
    setCategories((prev) =>
      prev
        .map((category) => (category.id === updated.id ? updated : category))
        .sort((left, right) => left.name.localeCompare(right.name)),
    );
    setCategoryEdits((prev) => ({
      ...prev,
      [updated.id]: { name: updated.name, slug: updated.slug },
    }));
    setResources((prev) =>
      prev.map((resource) =>
        resource.category.id === updated.id
          ? { ...resource, category: { id: updated.id, name: updated.name, slug: updated.slug } }
          : resource,
      ),
    );
    setEdits((prev) => {
      const next = { ...prev };
      for (const resource of resources) {
        if (resource.category.id === updated.id && next[resource.id]) {
          next[resource.id] = { ...next[resource.id], categorySlug: updated.slug };
        }
      }
      return next;
    });
    setCategoryNotice(`Saved category: ${updated.name}`);
    setTimeout(() => setCategoryNotice(null), 2000);
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
      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: 14 }}>Create category</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Name</span>
            <input
              value={newCategory.name}
              onChange={(event) => setCategoryDraft("name", event.target.value)}
              style={{ width: "100%", padding: "0.55rem", boxSizing: "border-box" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Slug</span>
            <input
              value={newCategory.slug}
              onChange={(event) => setCategoryDraft("slug", event.target.value)}
              style={{ width: "100%", padding: "0.55rem", boxSizing: "border-box" }}
            />
          </label>
          <button
            type="button"
            onClick={createCategory}
            disabled={creatingCategory}
            style={{ padding: "0.6rem 1rem", cursor: creatingCategory ? "wait" : "pointer", height: "fit-content" }}
          >
            {creatingCategory ? "Creating..." : "Add"}
          </button>
        </div>
        {categoryError && <p style={{ color: "#c62828", marginBottom: 0 }}>{categoryError}</p>}
        {categoryNotice && <p style={{ color: "#2e7d32", marginBottom: 0 }}>{categoryNotice}</p>}
      </section>
      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: 14 }}>Edit categories</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {categories.map((category) => {
            const draft = categoryEdits[category.id];
            if (!draft) return null;

            const isSavingCategory = savingCategory === category.id;
            return (
              <div
                key={category.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 10,
                  alignItems: "end",
                  padding: "0.6rem 0",
                  borderTop: "1px solid #eee",
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Name</span>
                  <input
                    value={draft.name}
                    onChange={(event) => setCategoryField(category.id, "name", event.target.value)}
                    style={{ width: "100%", padding: "0.55rem", boxSizing: "border-box" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Slug</span>
                  <input
                    value={draft.slug}
                    onChange={(event) => setCategoryField(category.id, "slug", event.target.value)}
                    style={{ width: "100%", padding: "0.55rem", boxSizing: "border-box" }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveCategory(category.id)}
                  disabled={isSavingCategory}
                  style={{
                    padding: "0.6rem 1rem",
                    cursor: isSavingCategory ? "wait" : "pointer",
                    height: "fit-content",
                  }}
                >
                  {isSavingCategory ? "Saving..." : "Save"}
                </button>
              </div>
            );
          })}
        </div>
        {categoryNotice && <p style={{ color: "#2e7d32", marginBottom: 0 }}>{categoryNotice}</p>}
      </section>
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
