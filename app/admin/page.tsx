import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import AdminDashboard from "@/components/AdminDashboard";
import { hasAdminSessionFromCookieStore } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { categories, resources } from "@/lib/schema";

async function getAdminData() {
  const [allResources, allCategories] = await Promise.all([
    db
      .select({
        id: resources.id,
        url: resources.url,
        title: resources.title,
        description: resources.description,
        createdAt: resources.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(resources)
      .innerJoin(categories, eq(resources.categoryId, categories.id))
      .orderBy(desc(resources.createdAt))
      .limit(200),
    db.select().from(categories).orderBy(categories.name),
  ]);

  return { allCategories, allResources };
}

export default async function AdminPage() {
  const authed = await hasAdminSessionFromCookieStore();

  if (!authed) {
    redirect("/admin/login");
  }

  const { allCategories, allResources } = await getAdminData();

  return <AdminDashboard initialCategories={allCategories} initialResources={allResources} />;
}
