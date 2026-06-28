"""HotspotPay FastAPI — launcher compatible Windows."""
import sys

# Windows requires SelectorEventLoop for async PostgreSQL drivers
if sys.platform == "win32":
    import asyncio
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(
            asyncio.WindowsSelectorEventLoopPolicy()
        )

import uvicorn
from app.config.settings import get_settings

settings = get_settings()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level="info",
    )
