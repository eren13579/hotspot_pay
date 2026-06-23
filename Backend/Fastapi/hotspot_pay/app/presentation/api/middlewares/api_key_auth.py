import logging
import re

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

EXEMPT_PATTERNS = [
    re.compile(r"^/$"),
    re.compile(r"^/health(/.*)?$"),
    re.compile(r"^/docs(/.*)?$"),
    re.compile(r"^/openapi\.json$"),
    re.compile(r"^/redoc(/.*)?$"),
]

ROUTER_POLL_PATTERN = re.compile(r"^/api/v1/router/[^/]+/pending-actions$")
ACK_PATTERN = re.compile(r"/actions/[^/]+/done$")
SCRIPT_PATTERN = re.compile(r"/(download-script|script-info)")
AGENT_PATTERN = re.compile(r"/agent/router-config$")
PUBLIC_PORTAL_PATTERN = re.compile(r"/plans/active$")
PUBLIC_HOTSPOT_PATTERN = re.compile(r"/hotspots/public/")
PUBLIC_PLANS_PATTERN = re.compile(r"/hotspots/[^/]+/plans/active$")
PORTAL_TICKET_PATTERN = re.compile(r"/api/v1/tickets/portal/")
SUBSCRIPTION_PLANS_PATTERN = re.compile(r"/subscriptions/plans$")


class ApiKeyMiddleware(BaseHTTPMiddleware):
    """Middleware that protects endpoints with API key.

    Uses exact regex matching to avoid the '/' prefix matching everything.
    Router polling endpoints use X-Router-Token instead.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Check exempt paths (exact regex match)
        for pattern in EXEMPT_PATTERNS:
            if pattern.match(path):
                return await call_next(request)

        # Router polling uses X-Router-Token
        if ROUTER_POLL_PATTERN.match(path):
            return await call_next(request)

        # ACK endpoints use X-Router-Token
        if ACK_PATTERN.search(path):
            return await call_next(request)

        # Script download/info endpoints (accessed by router agent with token in query)
        if SCRIPT_PATTERN.search(path):
            return await call_next(request)

        # Agent config
        if AGENT_PATTERN.search(path):
            return await call_next(request)

        # Public portal endpoints (no API key needed — captive portal)
        if PUBLIC_PORTAL_PATTERN.search(path):
            return await call_next(request)

        # Public hotspot info (no API key needed — portal page)
        if PUBLIC_HOTSPOT_PATTERN.search(path):
            return await call_next(request)

        # Public active plans list (no API key needed — portal page)
        if PUBLIC_PLANS_PATTERN.search(path):
            return await call_next(request)

        # Portal ticket connect/info — public (captive portal clients have no API key)
        if PORTAL_TICKET_PATTERN.search(path):
            return await call_next(request)

        # Public subscription plans list
        if SUBSCRIPTION_PLANS_PATTERN.search(path):
            return await call_next(request)

        # Validate API key
        api_key = request.headers.get("X-API-Key", "")
        if not api_key or api_key != settings.API_KEY:
            logger.warning("Invalid or missing API key for path %s", path)
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or missing API key"},
            )

        return await call_next(request)
