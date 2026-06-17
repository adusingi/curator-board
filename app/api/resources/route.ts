import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, categories } from "@/lib/schema";
import { hasBoardApiKey } from "@/lib/board-api-auth";
import { buildOkfConcept } from "@/lib/okf/concept";
import { eq, desc, ilike, or } from "drizzle-orm";
import { z } from "zod";

const CreateResourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  description: z.string().max(1000).nullish(),
  categorySlug: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Number(searchParams.get("offset") ?? "0");

  const query = searchParams.get("q");
  const whereClause = query
    ? or(ilike(resources.title, `%${query}%`), ilike(resources.description, `%${query}%`))
    : categorySlug
    ? eq(categories.slug, categorySlug)
    : undefined;

  const rows = await db
    .select({
      id: resources.id,
      url: resources.url,
      title: resources.title,
      description: resources.description,
      type: resources.type,
      tags: resources.tags,
      slug: resources.slug,
      createdAt: resources.createdAt,
      category: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(resources)
    .innerJoin(categories, eq(resources.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(resources.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ success: true, data: rows, meta: { limit, offset } });
}

export async function POST(req: NextRequest) {
  if (!hasBoardApiKey(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { url, title, description, categorySlug } = parsed.data;

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!category) {
    return NextResponse.json({ success: false, error: `Category '${categorySlug}' not found` }, { status: 404 });
  }

  // Assemble + validate the canonical OKF concept before anything enters the DB.
  const built = buildOkfConcept({ url, title, description, categorySlug });
  if (!built.ok) {
    return NextResponse.json({ success: false, error: built.error.flatten() }, { status: 400 });
  }
  const { concept } = built;

  const [resource] = await db
    .insert(resources)
    .values({
      url: concept.resource,
      title: concept.title,
      description: concept.description,
      categoryId: category.id,
      type: concept.type,
      tags: concept.tags,
      slug: concept.slug,
    })
    .onConflictDoUpdate({
      target: resources.url,
      set: {
        title: concept.title,
        description: concept.description,
        categoryId: category.id,
        type: concept.type,
        tags: concept.tags,
      },
    })
    .returning();

  return NextResponse.json({ success: true, data: resource }, { status: 201 });
}
