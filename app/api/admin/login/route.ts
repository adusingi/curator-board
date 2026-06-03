import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminSessionCookie,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

const LoginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { success: false, error: "ADMIN_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 });
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(createAdminSessionCookie());
  return response;
}
