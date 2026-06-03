import { NextResponse } from "next/server";
import { createClearedAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(createClearedAdminSessionCookie());
  return response;
}
