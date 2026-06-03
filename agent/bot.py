"""Telegram bot handlers for resource curation."""
import re
import os
import httpx
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)
import api_client as api
from parser import scrape_og, pick_category

OWNER_ID = int(os.environ.get("TELEGRAM_OWNER_ID", "0"))

URL_RE = re.compile(r"https?://\S+")


def _is_owner(update: Update) -> bool:
    return OWNER_ID == 0 or update.effective_user.id == OWNER_ID


# ── URL handler ────────────────────────────────────────────────────────────────

async def handle_url(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    match = URL_RE.search(text)
    if not match:
        return
    url = match.group(0).rstrip(".,)")

    if not _is_owner(update):
        await update.message.reply_text("Not authorised.")
        return

    await update.message.reply_text("⏳ Fetching…")

    try:
        og = await scrape_og(url)
        title = og["title"]
        description = og["description"]

        cats = await api.get_categories()
        slug = await pick_category(url, title, description, cats)

        cat_name = next((c["name"] for c in cats if c["slug"] == slug), slug)

        result = await api.post_resource(url, title, description, slug)
        if result.get("success"):
            resource_id = result["data"]["id"]
            await update.message.reply_text(
                f'✅ Added to *{cat_name}* (#{resource_id})\n"{title}"',
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ Error: {result.get('error', 'unknown')}")
    except httpx.ConnectError:
        await update.message.reply_text("❌ Board unavailable — try again in a moment.")
    except Exception as e:
        await update.message.reply_text(f"❌ Unexpected error: {type(e).__name__}")


# ── Commands ───────────────────────────────────────────────────────────────────

async def cmd_list(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    category = ctx.args[0] if ctx.args else None
    items = await api.get_resources(category=category, limit=10)
    if not items:
        await update.message.reply_text("No saved links found.")
        return
    lines = [f"*Recent links{' in ' + category if category else ''}:*"]
    for r in items:
        lines.append(f"#{r['id']} [{r['title']}]({r['url']}) — _{r['category']['name']}_")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown", disable_web_page_preview=True)


async def cmd_delete(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_owner(update):
        await update.message.reply_text("Not authorised.")
        return
    if not ctx.args or not ctx.args[0].isdigit():
        await update.message.reply_text("Usage: /delete <id>")
        return
    ok = await api.delete_resource(int(ctx.args[0]))
    await update.message.reply_text("✅ Deleted." if ok else "❌ Not found or error.")


async def cmd_search(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    query = " ".join(ctx.args)
    if not query:
        await update.message.reply_text("Usage: /search <query>")
        return
    items = await api.search_resources(query)
    if not items:
        await update.message.reply_text("No results.")
        return
    lines = [f"*Results for '{query}':*"]
    for r in items:
        lines.append(f"#{r['id']} [{r['title']}]({r['url']}) — _{r['category']['name']}_")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown", disable_web_page_preview=True)


async def cmd_categories(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    cats = await api.get_categories()
    lines = ["*Categories:*"] + [f"• `{c['slug']}` — {c['name']}" for c in cats]
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def cmd_addcategory(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _is_owner(update):
        await update.message.reply_text("Not authorised.")
        return
    if len(ctx.args) < 2:
        await update.message.reply_text("Usage: /addcategory <slug> <Name>")
        return
    slug = ctx.args[0].lower()
    name = " ".join(ctx.args[1:])
    result = await api.add_category(name, slug)
    if result.get("success"):
        await update.message.reply_text(f'✅ Added category *{name}* (`{slug}`)', parse_mode="Markdown")
    else:
        await update.message.reply_text(f"❌ {result.get('error', 'Error')}")


async def cmd_start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "📚 *Curator Board bot*\n\nSend any URL to save it.\n\n"
        "/list [category] — recent links\n"
        "/search <query> — search\n"
        "/delete <id> — remove\n"
        "/categories — list categories\n"
        "/addcategory <slug> <Name> — add category",
        parse_mode="Markdown",
    )


# ── App builder ────────────────────────────────────────────────────────────────

def build_app(token: str) -> Application:
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("list", cmd_list))
    app.add_handler(CommandHandler("delete", cmd_delete))
    app.add_handler(CommandHandler("search", cmd_search))
    app.add_handler(CommandHandler("categories", cmd_categories))
    app.add_handler(CommandHandler("addcategory", cmd_addcategory))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_url))
    return app
