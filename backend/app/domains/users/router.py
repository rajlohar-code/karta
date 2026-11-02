import secrets
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import RedirectResponse

from app.config import settings
from app.core.session import (
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE,
    sign_session_data,
)
from app.dependencies import get_current_user
from app.domains.users.models import User
from app.domains.users.schemas import DevLoginRequest, UserResponse
from app.domains.workspaces.models import Workspace, WorkspaceMember
from app.infra.database import get_db
from app.services.log_service import log_endpoint

# Create the dedicated APIRouter for Auth & User endpoints
# Following RESTful conventions (Rule 10): prefix="/api/v1/auth", tags=["Authentication"]
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/dev-session",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Create local development authenticated session",
)
@log_endpoint(folder_name="auth", file_name="auth.log")
async def create_dev_session(
    request: Request,
    response: Response,
    payload: DevLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Issue an HTTP-Only signed session cookie for local development and testing.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Allows developers and automated test suites to log in instantly without
    needing a live Google OAuth client configured. In production, this route is disabled.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: POST
      - URL        : /api/v1/auth/dev-session
      - Payload JSON Example:
        ```json
        {
          "email": "dev@karta.app",
          "name": "Dev User",
          "role": "user"
        }
        ```
        
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 200 OK
      - Header     : Set-Cookie: karta_session=eyJ...; HttpOnly; SameSite=Lax
      - Body JSON Example:
        ```json
        {
          "id": 1,
          "email": "dev@karta.app",
          "name": "Dev User",
          "avatar_url": null,
          "role": "user",
          "is_active": true,
          "created_at": "2026-11-01T12:00:00Z"
        }
        ```
    ---------------------------------------------------------------------------
    """
    # 1. Check if user already exists in PostgreSQL
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # 2. If not, create and persist a new User record
    if not user:
        user = User(
            email=payload.email,
            name=payload.name,
            role=payload.role,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 3. Create cryptographically signed session token (karta_security.md Layer 1)
    session_token = sign_session_data({"user_id": user.id})

    # 4. Attach HTTP-only signed session cookie to the response
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,  # True in production (HTTPS), False in local development
        path="/",
    )

    return user


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
@log_endpoint(folder_name="auth", file_name="auth.log")
async def get_my_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve profile details of the currently logged-in user.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Consumed by the React frontend (`useAuth` hook) on page load to check
    whether the user is logged in, their role, and display their avatar.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: GET
      - URL        : /api/v1/auth/me
      - Headers    : Cookie: karta_session=...
      - Payload    : None
      
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 200 OK
      - Body JSON Example:
        ```json
        {
          "id": 1,
          "email": "dev@karta.app",
          "name": "Dev User",
          "avatar_url": null,
          "role": "user",
          "is_active": true,
          "created_at": "2026-11-01T12:00:00Z"
        }
        ```
    ---------------------------------------------------------------------------
    """
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out and invalidate session cookie",
)
@log_endpoint(folder_name="auth", file_name="auth.log")
async def logout(
    request: Request,
    response: Response,
):
    """
    Log out the user and clear the HTTP-Only session cookie.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Instructs the browser to delete the 'karta_session' cookie immediately.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: POST
      - URL        : /api/v1/auth/logout
      - Payload    : None
      
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 200 OK
      - Header     : Set-Cookie: karta_session=""; Max-Age=0
      - Body JSON Example:
        ```json
        {
          "status": "ok",
          "message": "Logged out successfully"
        }
        ```
    ---------------------------------------------------------------------------
    """
    # Delete cookie by setting Max-Age=0
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )
    return {"status": "ok", "message": "Logged out successfully"}


# -----------------------------------------------------------------------------
# Google OAuth 2.0 Integration
# -----------------------------------------------------------------------------
@router.get(
    "/google/login",
    status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    summary="Redirect user to Google OAuth consent page",
)
@log_endpoint(folder_name="auth", file_name="auth.log")
async def google_login(request: Request):
    """
    Redirect the user to Google's OAuth 2.0 consent screen.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server.",
        )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=google_auth_url)


@router.get(
    "/google/callback",
    summary="Google OAuth 2.0 callback endpoint",
)
@log_endpoint(folder_name="auth", file_name="auth.log")
async def google_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth 2.0 redirect callback.
    Exchanges code for tokens, fetches user profile, creates/updates user,
    issues signed session cookie, and redirects user to frontend.
    """
    if error or not code:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=google_auth_cancelled")

    # 1. Exchange authorization code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=token_data)
        if token_resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=token_exchange_failed")
        tokens = token_resp.json()
        access_token = tokens.get("access_token")

        # 2. Fetch user profile from Google UserInfo endpoint
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=userinfo_fetch_failed")
        user_info = userinfo_resp.json()

    email = user_info.get("email")
    name = user_info.get("name") or email.split("@")[0]
    avatar_url = user_info.get("picture")

    if not email:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=no_email_provided")

    # 3. Lookup user in database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Determine role: check if email is in ADMIN_EMAILS
    is_admin = settings.is_admin_email(email)

    if not user:
        # Create new user
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            role="admin" if is_admin else "user",
            is_active=True,
        )
        db.add(user)
        await db.flush()

        # Automatically create default Personal Workspace for new user
        raw_slug = secrets.token_urlsafe(6).replace("-", "").replace("_", "")[:8]
        workspace = Workspace(
            name=f"{name.split()[0]}'s Workspace",
            slug=f"w_{raw_slug}",
            owner_id=user.id,
        )
        db.add(workspace)
        await db.flush()

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner",
        )
        db.add(member)
        await db.commit()
    else:
        # Update existing user profile & elevate to admin if listed in ADMIN_EMAILS
        user.name = name
        user.avatar_url = avatar_url
        if is_admin and user.role != "admin":
            user.role = "admin"
        await db.commit()

    # 4. Issue signed session cookie and redirect to frontend
    session_cookie = sign_session_data({"user_id": user.id})
    redirect_target = f"{settings.FRONTEND_URL}/"

    response = RedirectResponse(url=redirect_target, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_cookie,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,  # True in production (HTTPS required), False in local development
        path="/",
    )
    return response
