"""
Integration Tests for Karta Authentication & Session Lifecycle.

Endpoints Tested:
- POST /api/v1/auth/dev-session
- GET  /api/v1/auth/me
- POST /api/v1/auth/logout
"""
import pytest
from httpx import AsyncClient

from app.core.session import SESSION_COOKIE_NAME


@pytest.mark.asyncio
async def test_unauthenticated_request_is_denied(client: AsyncClient):
    """
    Security Test (Deny-First Guard):
    A request to /api/v1/auth/me without an authentication cookie MUST be rejected with 401.
    """
    # 1. Make GET request without passing any session cookie
    response = await client.get("/api/v1/auth/me")
    
    # 2. Assert 401 Unauthorized
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


@pytest.mark.asyncio
async def test_dev_session_login_and_cookie_generation(client: AsyncClient):
    """
    Integration Test:
    Calling /api/v1/auth/dev-session creates/finds the user, returns user details,
    and attaches an HTTP-Only signed session cookie.
    """
    payload = {
        "email": "test.engineer@karta.app",
        "name": "Test Engineer",
        "role": "user"
    }

    # 1. Send login POST request
    response = await client.post("/api/v1/auth/dev-session", json=payload)
    
    # 2. Check HTTP status code
    assert response.status_code == 200
    
    # 3. Check response data
    data = response.json()
    assert data["email"] == "test.engineer@karta.app"
    assert data["name"] == "Test Engineer"
    assert data["role"] == "user"
    assert "id" in data
    
    # 4. Check Set-Cookie response header (karta_security.md Layer 1)
    set_cookie = response.headers.get("set-cookie", "")
    assert SESSION_COOKIE_NAME in set_cookie
    assert "httponly" in set_cookie.lower()
    assert "samesite=lax" in set_cookie.lower()


@pytest.mark.asyncio
async def test_authenticated_profile_retrieval(client: AsyncClient):
    """
    Integration Test:
    A user with a valid session cookie can successfully retrieve their profile.
    """
    # 1. First, authenticate to get a session cookie
    login_res = await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "alice@karta.app", "name": "Alice Developer", "role": "user"}
    )
    assert login_res.status_code == 200
    
    # 2. Now call /api/v1/auth/me using the cookie set during login
    me_res = await client.get("/api/v1/auth/me")
    
    # 3. Assert profile is returned
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "alice@karta.app"
    assert profile["name"] == "Alice Developer"


@pytest.mark.asyncio
async def test_dev_session_rejects_invalid_role(client: AsyncClient):
    """
    Contract & Validation Test (Pydantic Strictness):
    Role must be either 'user' or 'admin'. Any invalid string must be rejected with 422.
    """
    payload = {
        "email": "hacker@karta.app",
        "name": "Bad Actor",
        "role": "super_root_admin"  # Invalid! Not in ^(user|admin)$
    }
    response = await client.post("/api/v1/auth/dev-session", json=payload)
    
    # Assert 422 Unprocessable Entity
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_logout_invalidates_session_cookie(client: AsyncClient):
    """
    Lifecycle Test:
    Calling /api/v1/auth/logout must instruct the browser to delete the session cookie.
    """
    response = await client.post("/api/v1/auth/logout")
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    
    # Cookie should have Max-Age=0 or past expires date
    set_cookie = response.headers.get("set-cookie", "")
    assert "Max-Age=0" in set_cookie or "expires=" in set_cookie.lower()


@pytest.mark.asyncio
async def test_google_login_redirect_url(client: AsyncClient):
    """
    OAuth Test:
    Calling /api/v1/auth/google/login must redirect (307) to Google OAuth consent page
    with correct client_id, scope, and redirect_uri parameters.
    """
    response = await client.get("/api/v1/auth/google/login", follow_redirects=False)
    
    assert response.status_code == 307
    location = response.headers.get("location", "")
    assert "accounts.google.com/o/oauth2/v2/auth" in location
    assert "client_id=" in location
    assert "scope=openid+email+profile" in location or "scope=openid%20email%20profile" in location
    assert "redirect_uri=" in location

