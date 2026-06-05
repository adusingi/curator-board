import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildBot } from "./bot";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

loadDotenv({ path: resolve(repoRoot, ".env.local") });
loadDotenv({ path: resolve(repoRoot, ".env"), override: true });
loadDotenv({ path: "/app/.env", override: true });
loadDotenv({ path: resolve(here, ".env"), override: true });
loadDotenv();

async function waitForBoard(): Promise<void> {
  const boardUrl = (process.env.BOARD_API_URL || "http://board:3000").replace(/\/+$/, "");
  const url = `${boardUrl}/api/categories`;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.status < 500) {
        console.info("Board is ready.");
        return;
      }
    } catch {
      // keep retrying
    }

    console.info("Waiting for board… attempt %d/30", attempt);
    await new Promise((resolveAttempt) => setTimeout(resolveAttempt, 10_000));
  }

  console.warn("Board did not become ready — starting anyway.");
}

async function main(): Promise<void> {
  await waitForBoard();

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required");
  }

  const bot = buildBot(token);
  console.info("Curator Board bot starting — polling…");
  await bot.start({
    allowed_updates: ["message"],
    onStart: () => {
      console.info("Curator Board bot polling.");
    },
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
