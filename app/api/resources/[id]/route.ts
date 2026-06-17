import { NextRequest, NextResponse } from "next/server";
import { hasBoardApiKey } from "@/lib/board-api-auth";
import { hasAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { resources, categories } from "@/lib/schema";
import { OkfConceptSchema } from "@/lib/okf/concept";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasBoardApiKey(req) && !hasAdminSession(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  const deleted = await db.delete(resources).where(eq(resources.id, numId)).returning();

  if (!deleted.length) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

const UpdateResourceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(1000).nullish(),
  categorySlug: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasBoardApiKey(req) && !hasAdminSession(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, categorySlug } = parsed.data;
  if (title === undefined && description === undefined && !categorySlug) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  // Load the current row (joined with its category) so we can re-validate the
  // resulting OKF concept before persisting any change.
  const [current] = await db
    .select({
      url: resources.url,
      title: resources.title,
      description: resources.description,
      type: resources.type,
      tags: resources.tags,
      slug: resources.slug,
      categoryId: resources.categoryId,
      categorySlug: categories.slug,
    })
    .from(resources)
    .innerJoin(categories, eq(resources.categoryId, categories.id))
    .where(eq(resources.id, numId))
    .limit(1);

  if (!current) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  let categoryId = current.categoryId;
  let nextCategorySlug = current.categorySlug;
  let tags = current.tags;
  if (categorySlug && categorySlug !== current.categorySlug) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (!cat) {
      return NextResponse.json({ success: false, error: `Category '${categorySlug}' not found` }, { status: 404 });
    }
    categoryId = cat.id;
    nextCategorySlug = cat.slug;
    tags = [cat.slug];
  }

  const nextTitle = title ?? current.title;
  const nextDescription = description !== undefined ? description ?? null : current.description;

  // slug and type stay fixed (stable concept id); re-validate the whole concept.
  const validated = OkfConceptSchema.safeParse({
    type: current.type,
    title: nextTitle,
    description: nextDescription,
    resource: current.url,
    categorySlug: nextCategorySlug,
    tags,
    slug: current.slug,
  });
  if (!validated.success) {
    return NextResponse.json({ success: false, error: validated.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(resources)
    .set({ title: nextTitle, description: nextDescription, categoryId, tags })
    .where(eq(resources.id, numId))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}
