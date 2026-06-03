import { db } from "@/lib/db";
import { resources, categories } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import ResourceList from "@/components/ResourceList";

export const dynamic = "force-dynamic";

async function getData() {
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
  return { resources: allResources, categories: allCategories };
}

export default async function HomePage() {
  const { resources: items, categories: cats } = await getData();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px" }}>
      {/* Header — C-style editorial */}
      <header style={{ borderBottom: "3px solid #000", paddingBottom: 14, marginBottom: 28 }}>
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 10,
            color: "#aaa",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          resources.infiniwa.com
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            fontWeight: 700,
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          Curated Links
        </h1>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 12,
            color: "#888",
            margin: "4px 0 0",
          }}
        >
          Collected by adusingi — newest first
        </p>
      </header>
      <ResourceList items={items} categories={cats} />
    </div>
  );
}
