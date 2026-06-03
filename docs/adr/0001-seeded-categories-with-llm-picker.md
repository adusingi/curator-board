# Seeded category list with Claude as picker

Categories are defined once as a seeded list in the database. When a new URL is submitted, Claude receives the resource title, description, and URL, then picks the closest category slug from the list. An "Other" catch-all exists for anything that doesn't fit. New categories can be added via `/addcategory` in Telegram.

## Consequences

- Claude never invents categories — the taxonomy stays controlled
- Seeded list is inserted at migration time; adding a category is a DB row, not a deploy
- If Claude picks wrong, the owner can `/delete <id>` and re-submit with a hint
- "Other" category prevents uncategorised resources accumulating silently
