import type { NextRequest } from "next/server";

export function hasBoardApiKey(req: NextRequest): boolean {
  const key = req.headers.get("x-api-key");
  return !!key && key === process.env.BOARD_API_SECRET;
}
