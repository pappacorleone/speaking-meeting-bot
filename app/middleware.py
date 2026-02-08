"""Middleware for anonymous user sessions and request logging.

Sets a browser cookie to identify returning visitors without requiring login.
Each visitor gets a unique session token stored in SQLite.
"""

import os
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from core.database import create_user_session, get_user_session, touch_user_session
from meetingbaas_pipecat.utils.logger import logger

COOKIE_NAME = "diadi_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 365  # 1 year
COOKIE_PATH = "/"
COOKIE_SAMESITE = "lax"
COOKIE_HTTPONLY = True

# Secure cookies in production (HTTPS), insecure for localhost dev
_is_dev = os.getenv("DIADI_ENV", "development") == "development"
COOKIE_SECURE = not _is_dev

# Paths that skip session handling
SKIP_PATHS = frozenset({
    "/health",
    "/health/detailed",
    "/docs",
    "/openapi.json",
    "/redoc",
})


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status code, and duration for each HTTP request."""

    SKIP_PATHS = frozenset({"/health", "/health/detailed"})

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.0f}ms)"
        )
        return response


class AnonymousSessionMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns an anonymous session cookie to every visitor."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip for non-HTTP paths and utility endpoints
        if request.url.path in SKIP_PATHS:
            return await call_next(request)

        # Skip for CORS preflight requests (handled by CORSMiddleware)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip for WebSocket upgrade requests (cookies are read from
        # the initial handshake headers, not via middleware)
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        session_id = request.cookies.get(COOKIE_NAME)
        needs_cookie = False

        if session_id:
            # Validate the session exists in DB
            existing = await get_user_session(session_id)
            if existing:
                # Valid session — update last_seen
                await touch_user_session(session_id)
            else:
                # Cookie references a deleted/invalid session — create new
                session_id = str(uuid.uuid4())
                await create_user_session(session_id)
                needs_cookie = True
                logger.debug(f"Replaced invalid session cookie with {session_id}")
        else:
            # No cookie — first visit
            session_id = str(uuid.uuid4())
            await create_user_session(session_id)
            needs_cookie = True
            logger.debug(f"Created new anonymous session {session_id}")

        # Attach to request state so routes can access it
        request.state.user_session_id = session_id

        response = await call_next(request)

        if needs_cookie:
            response.set_cookie(
                key=COOKIE_NAME,
                value=session_id,
                max_age=COOKIE_MAX_AGE,
                path=COOKIE_PATH,
                httponly=COOKIE_HTTPONLY,
                samesite=COOKIE_SAMESITE,
                secure=COOKIE_SECURE,
            )

        return response
