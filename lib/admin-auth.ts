import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "curator_admin_session";

const ADMIN_SESSION_SCOPE = "curator-board-admin-session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function getAdminSessionSecret(): string | null {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.BOARD_API_SECRET?.trim() ||
    getAdminPassword()
  );
}

function createAdminSessionValue(): string | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  return createHmac("sha256", secret).update(ADMIN_SESSION_SCOPE).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminPasswordConfigured(): boolean {
  return !!getAdminPassword();
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  return safeEqual(candidate, expected);
}

export function hasValidAdminSessionCookie(cookieValue?: string | null): boolean {
  const expected = createAdminSessionValue();
  if (!expected || !cookieValue) return false;

  return safeEqual(cookieValue, expected);
}

export function hasAdminSession(req: NextRequest): boolean {
  return hasValidAdminSessionCookie(req.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null);
}

export async function hasAdminSessionFromCookieStore(): Promise<boolean> {
  const cookieStore = await cookies();
  return hasValidAdminSessionCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null);
}

export function createAdminSessionCookie() {
  const value = createAdminSessionValue();
  if (!value) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }

  return {
    name: ADMIN_SESSION_COOKIE,
    value,
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function createClearedAdminSessionCookie() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
