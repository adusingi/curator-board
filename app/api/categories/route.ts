import { NextRequest, NextResponse } from "next/server";
import { hasBoardApiKey } from "@/lib/board-api-auth";
import { hasAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const AddCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

export async function GET() {
  const rows = await db.select().from(categories).orderBy(categories.name);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  if (!hasBoardApiKey(req) && !hasAdminSession(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AddCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, slug } = parsed.data;

  const [existing] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (existing) {
    return NextResponse.json({ success: false, error: `Slug '${slug}' already exists` }, { status: 409 });
  }

  const [category] = await db
    .insert(categories)
    .values({ name, slug, seeded: false })
    .returning();

  return NextResponse.json({ success: true, data: category }, { status: 201 });
}
