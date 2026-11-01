from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.session import SESSION_COOKIE_NAME, verify_session_token
from app.domains.users.models import User
from app.infra.database import get_db


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI Dependency to authenticate requests via HTTP-Only Signed Session Cookies.
    Grounded in: karta_security.md (Layer 1 — Authentication)
    
    ---------------------------------------------------------------------------
    HOW IT WORKS (The Security Chain):
    1. Reads the HTTP-only signed cookie named 'karta_session'.
    2. Validates HMAC-SHA256 digital signature and expiration (7 days).
    3. Fetches the active User row from PostgreSQL using AsyncSession.
    4. Enforces soft-suspension: if `is_active == False`, instantly blocks access!
    5. Returns the authenticated User model to the endpoint.
    ---------------------------------------------------------------------------
    """
    # Step 1: Extract cookie from request headers
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )

    # Step 2: Cryptographically verify digital seal and 7-day expiration
    payload = verify_session_token(session_token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again.",
        )

    # Step 3: Fetch user from PostgreSQL database
    user_id = payload["user_id"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this session no longer exists.",
        )

    # Step 4: Security Check — Has this user been suspended by an Admin?
    # karta_security.md: "On user suspension: block active sessions immediately"
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact administrator.",
        )

    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Optional Authentication Dependency.
    Used for public diagrams where anonymous visitors can view,
    but logged-in users receive elevated editing capabilities if permitted.
    """
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        return None

    payload = verify_session_token(session_token)
    if not payload or "user_id" not in payload:
        return None

    result = await db.execute(select(User).where(User.id == payload["user_id"]))
    user = result.scalar_one_or_none()

    if user and user.is_active:
        return user

    return None


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Admin Authorization Dependency.
    Grounded in: karta_security.md (Layer 7 — Admin Panel Security)
    
    Ensures the user holds the 'admin' role on the server-side.
    Frontend route protection is just UX; this guard enforces zero bypass.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user
