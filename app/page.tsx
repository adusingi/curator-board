import { db } from "@/lib/db";
import { resources, categories } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import ResourceList from "@/components/ResourceList";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import WeatherBadge from "@/components/WeatherBadge";

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

const DEFAULT_TITLE = "Curated Links";
const DEFAULT_SUMMARY = "Collected by you — newest first";

export default async function HomePage() {
  const { resources: items, categories: cats } = await getData();
  const boardTitle = process.env.BOARD_TITLE || DEFAULT_TITLE;
  const boardSummary = process.env.BOARD_SUMMARY || DEFAULT_SUMMARY;

  return (
    <div className="board-page">
      <div className="board-shell">
        <header className="board-header">
          <div className="board-header-top">
            <div className="board-eyebrow">Curator Board</div>
            <WeatherBadge defaultLat={process.env.WEATHER_LAT} defaultLon={process.env.WEATHER_LON} />
          </div>
          <h1 className="board-title">{boardTitle}</h1>
          <p className="board-summary">{boardSummary}</p>
        </header>
        <ResourceList items={items} categories={cats} />
        <footer className="board-footer">
          <div className="board-footer-links">
            <a
              href="https://github.com/adusingi/curator-board/"
              target="_blank"
              rel="noopener noreferrer"
              className="board-footer-link"
            >
              <svg className="board-footer-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <span>clone this project</span>
            </a>
            <a
              href="https://www.buymeacoffee.com/adusingi"
              target="_blank"
              rel="noopener noreferrer"
              className="board-footer-link"
            >
              <svg className="board-footer-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8h15zm-1 6h1a2 2 0 1 0 0-4h-1v4zM3 6h14v1H3V6zm2-2h10v1H5V4z" />
              </svg>
              <span>support my work and buy me a coffee</span>
            </a>
          </div>
          <ThemeSwitcher />
        </footer>
      </div>
    </div>
  );
}
