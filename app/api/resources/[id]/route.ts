import { NextRequest, NextResponse } from "next/server";
import { hasBoardApiKey } from "@/lib/board-api-auth";
import { hasAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { resources, categories } from "@/lib/schema";
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
  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;

  if (categorySlug) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (!cat) {
      return NextResponse.json({ success: false, error: `Category '${categorySlug}' not found` }, { status: 404 });
    }
    updateData.categoryId = cat.id;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(resources)
    .set(updateData)
    .where(eq(resources.id, numId))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
