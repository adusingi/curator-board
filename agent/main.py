"""Entry point for the Resources Telegram bot agent."""
import asyncio
import logging
import os
from pathlib import Path
import httpx
from dotenv import load_dotenv

_here = Path(__file__).parent
_repo_root = _here.parent
load_dotenv(_repo_root / ".env.local")           # local dev
load_dotenv(Path("/app/.env"), override=True)    # production: always wins over empty Docker env vars
load_dotenv(_here / ".env", override=True)       # fallback paths
load_dotenv(_repo_root / ".env", override=True)
load_dotenv()

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

from bot import build_app


async def _wait_for_board() -> None:
    """Wait until the board API responds before starting the bot."""
    board_url = os.environ.get("BOARD_API_URL", "http://board:3000").rstrip("/")
    url = f"{board_url}/api/categories"
    for attempt in range(1, 31):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(url)
                if r.status_code < 500:
                    logger.info("Board is ready.")
                    return
        except Exception:
            pass
        logger.info("Waiting for board… attempt %d/30", attempt)
        await asyncio.sleep(10)
    logger.warning("Board did not become ready — starting anyway.")


def main() -> None:
    asyncio.run(_wait_for_board())
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    app = build_app(token)
    logging.info("Resources bot starting — polling…")
    app.run_polling(allowed_updates=["message"])


if __name__ == "__main__":
    main()
