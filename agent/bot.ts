import { Bot, Context } from "grammy";
import {
  addCategory,
  deleteResource,
  getCategories,
  getResources,
  postResource,
  searchResources,
} from "./api-client";
import { pickCategory, scrapeOg } from "./parser";

const OWNER_ID = Number(process.env.TELEGRAM_OWNER_ID ?? "0");
const URL_RE = /(?:https?:\/\/\S+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\S*)/;

function isOwner(ctx: Context): boolean {
  return OWNER_ID === 0 || ctx.from?.id === OWNER_ID;
}

function parseArgs(text: string): string[] {
  return text.trim().split(/\s+/).slice(1);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function handleUrl(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? "";
  const match = text.match(URL_RE);
  if (!match) {
    return;
  }

  const raw = match[0].replace(/[.,)]+$/, "");
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!isOwner(ctx)) {
    await ctx.reply("Not authorised.");
    return;
  }

  await ctx.reply("⏳ Fetching…");

  try {
    const og = await scrapeOg(url);
    const categories = await getCategories();
    const slug = await pickCategory(url, og.title, og.description, categories);
    const categoryName = categories.find((category) => category.slug === slug)?.name ?? slug;
    const result = await postResource(url, og.title, og.description, slug);

    if (result.success && result.data) {
      await ctx.reply(
        `✅ Added to <b>${escapeHtml(categoryName)}</b> (#${result.data.id})\n"${escapeHtml(og.title)}"`,
        { parse_mode: "HTML" },
      );
      return;
    }

    await ctx.reply(`❌ Error: ${String(result.error ?? "unknown")}`);
  } catch (error) {
    if (error instanceof TypeError) {
      await ctx.reply("❌ Board unavailable — try again in a moment.");
      return;
    }

    await ctx.reply(`❌ Unexpected error: ${error instanceof Error ? error.name : "Error"}`);
  }
}

async function cmdList(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? "";
  const [category] = parseArgs(text);
  const items = await getResources(category, 10);

  if (items.length === 0) {
    await ctx.reply("No saved links found.");
    return;
  }

  const lines = [`<b>Recent links${category ? ` in ${escapeHtml(category)}` : ""}:</b>`];
  for (const item of items) {
    lines.push(
      `#${item.id} <a href="${item.url}">${escapeHtml(item.title)}</a> — <i>${escapeHtml(item.category.name)}</i>`,
    );
  }

  await ctx.reply(lines.join("\n"), {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

async function cmdDelete(ctx: Context): Promise<void> {
  if (!isOwner(ctx)) {
    await ctx.reply("Not authorised.");
    return;
  }

  const text = ctx.message?.text ?? "";
  const [id] = parseArgs(text);
  if (!id || !/^\d+$/.test(id)) {
    await ctx.reply("Usage: /delete <id>");
    return;
  }

  const ok = await deleteResource(Number(id));
  await ctx.reply(ok ? "✅ Deleted." : "❌ Not found or error.");
}

async function cmdSearch(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? "";
  const query = parseArgs(text).join(" ");
  if (!query) {
    await ctx.reply("Usage: /search <query>");
    return;
  }

  const items = await searchResources(query);
  if (items.length === 0) {
    await ctx.reply("No results.");
    return;
  }

  const lines = [`<b>Results for '${escapeHtml(query)}':</b>`];
  for (const item of items) {
    lines.push(
      `#${item.id} <a href="${item.url}">${escapeHtml(item.title)}</a> — <i>${escapeHtml(item.category.name)}</i>`,
    );
  }

  await ctx.reply(lines.join("\n"), {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

async function cmdCategories(ctx: Context): Promise<void> {
  const categories = await getCategories();
  const lines = ["<b>Categories:</b>"];
  for (const category of categories) {
    lines.push(`• <code>${escapeHtml(category.slug)}</code> — ${escapeHtml(category.name)}`);
  }
  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}

async function cmdAddCategory(ctx: Context): Promise<void> {
  if (!isOwner(ctx)) {
    await ctx.reply("Not authorised.");
    return;
  }

  const text = ctx.message?.text ?? "";
  const args = parseArgs(text);
  if (args.length < 2) {
    await ctx.reply("Usage: /addcategory <slug> <Name>");
    return;
  }

  const slug = args[0].toLowerCase();
  const name = args.slice(1).join(" ");
  const result = await addCategory(name, slug);

  if (result.success) {
    await ctx.reply(`✅ Added category <b>${escapeHtml(name)}</b> (<code>${escapeHtml(slug)}</code>)`, {
      parse_mode: "HTML",
    });
    return;
  }

  await ctx.reply(`❌ ${String(result.error ?? "Error")}`);
}

async function cmdStart(ctx: Context): Promise<void> {
  await ctx.reply(
    [
      "📚 <b>Curator Board bot</b>",
      "",
      "Send any URL to save it.",
      "",
      "/list [category] — recent links",
      "/search <query> — search",
      "/delete <id> — remove",
      "/categories — list categories",
      "/addcategory <slug> <Name> — add category",
    ].join("\n"),
    { parse_mode: "HTML" },
  );
}

export function buildBot(token: string): Bot {
  const bot = new Bot(token);
  bot.command("start", cmdStart);
  bot.command("list", cmdList);
  bot.command("delete", cmdDelete);
  bot.command("search", cmdSearch);
  bot.command("categories", cmdCategories);
  bot.command("addcategory", cmdAddCategory);
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) {
      return;
    }
    await handleUrl(ctx);
  });
  return bot;
}
