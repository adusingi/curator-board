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
    <div className="board-page">
      <div className="board-shell">
        <header className="board-header">
          <div className="board-header-top">
            <div className="board-eyebrow">Curator Board</div>
            <div className="board-state">{items.length} saved links</div>
          </div>
          <h1 className="board-title">Collected for the terminal-minded.</h1>
          <p className="board-summary">
            A self-hosted board for links worth keeping: quiet enough to browse, structured enough to publish,
            and opinionated enough to feel like a real product instead of a default template.
          </p>
        </header>
        <ResourceList items={items} categories={cats} />
      </div>
    </div>
  );
}
