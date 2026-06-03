"use client";

import { useState } from "react";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Login failed.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 420, margin: "80px auto", fontFamily: "monospace" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Admin Login</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: "1rem", lineHeight: 1.5 }}>
        Sign in with <code>ADMIN_PASSWORD</code> to manage resources.
      </p>
      {error && <p style={{ color: "#c62828", marginBottom: "0.75rem" }}>{error}</p>}
      <input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !submitting && login()}
        style={{ width: "100%", padding: "0.75rem", marginBottom: "0.75rem", boxSizing: "border-box" }}
        autoFocus
      />
      <button
        type="button"
        onClick={login}
        disabled={submitting}
        style={{ padding: "0.6rem 1rem", cursor: submitting ? "wait" : "pointer" }}
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
