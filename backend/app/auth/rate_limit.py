import threading
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, status

from backend.app.auth.security import get_current_user
from backend.app.config import settings
from backend.app.models.user import User

_DAY = 24 * 60 * 60
_MINUTE = 60

_lock = threading.Lock()
_hits: dict = defaultdict(deque)


def consume_ai_quota(user: User) -> None:
    """Record one AI call for the user, or raise 429 if they are over a limit.

    In-memory and per-process: counters reset when the server restarts and are
    not shared between workers. Swap for Redis if you scale out.
    """
    now = time.time()

    with _lock:
        window = _hits[user.id]

        while window and now - window[0] > _DAY:
            window.popleft()

        if len(window) >= settings.AI_DAILY_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Daily AI limit reached ({settings.AI_DAILY_LIMIT} requests). "
                    "Please try again tomorrow."
                ),
            )

        last_minute = sum(1 for t in window if now - t <= _MINUTE)
        if last_minute >= settings.AI_BURST_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You're going a little fast. Please wait a minute and try again.",
            )

        window.append(now)


def ai_rate_limit(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: authenticates the user and counts the call against their AI quota."""
    consume_ai_quota(current_user)
    return current_user
