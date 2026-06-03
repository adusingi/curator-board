import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin-auth";
import { hasBoardApiKey } from "@/lib/board-api-auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
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
  const parsed = UpdateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, slug } = parsed.data;

  const [existing] = await db.select().from(categories).where(eq(categories.id, numId)).limit(1);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const [conflict] = await db
    .select()
    .from(categories)
    .where(or(eq(categories.name, name), eq(categories.slug, slug)))
    .limit(10);

  if (conflict && conflict.id !== numId) {
    return NextResponse.json({ success: false, error: "Category name or slug already exists" }, { status: 409 });
  }

  const [updated] = await db
    .update(categories)
    .set({ name, slug })
    .where(eq(categories.id, numId))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}
