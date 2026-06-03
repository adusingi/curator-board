import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import {
  hasAdminSessionFromCookieStore,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await hasAdminSessionFromCookieStore()) {
    redirect("/admin");
  }

  if (!isAdminPasswordConfigured()) {
    return (
      <div style={{ padding: "2rem", maxWidth: 520, margin: "80px auto", fontFamily: "monospace" }}>
        <h1 style={{ marginBottom: "0.75rem" }}>Admin Login Unavailable</h1>
        <p style={{ color: "#666", lineHeight: 1.6 }}>
          <code>ADMIN_PASSWORD</code> is not configured yet. Add it to the board environment before using the
          admin interface.
        </p>
      </div>
    );
  }

  return <AdminLoginForm />;
}
