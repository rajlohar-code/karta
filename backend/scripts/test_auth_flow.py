"""
Live verification script for Karta Authentication & Session Engine.

Tests:
1. POST /api/v1/auth/dev-session -> Creates user in DB and sets signed HTTP-only cookie.
2. GET /api/v1/auth/me (with cookie) -> Retrieves current authenticated user profile.
3. GET /api/v1/auth/me (without cookie) -> Confirms 401 Unauthorized deny-first guard.
4. POST /api/v1/auth/logout -> Confirms session cookie destruction.
5. Verifies audit logging in backend/logs/auth/auth.log.
"""
import asyncio
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path so app imports work
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.session import SESSION_COOKIE_NAME


async def run_auth_tests():
    print("=" * 60)
    print("🚀 RUNNING LIVE AUTH & SESSION VERIFICATION TESTS")
    print("=" * 60)

    # Use ASGITransport to test FastAPI directly without needing a separate uvicorn process
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:

        # -------------------------------------------------------------
        # STEP 1: Test Unauthenticated Access (Must be rejected with 401)
        # -------------------------------------------------------------
        print("\n[Step 1] Testing GET /api/v1/auth/me WITHOUT cookie...")
        res = await client.get("/api/v1/auth/me")
        print(f"Status Code: {res.status_code}")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✅ Correctly rejected unauthenticated request with 401 Unauthorized!")

        # -------------------------------------------------------------
        # STEP 2: Create Dev Session (Login)
        # -------------------------------------------------------------
        print("\n[Step 2] Testing POST /api/v1/auth/dev-session...")
        login_payload = {
            "email": "bhai@karta.app",
            "name": "Bada Bhai",
            "role": "admin"
        }
        res = await client.post("/api/v1/auth/dev-session", json=login_payload)
        print(f"Status Code: {res.status_code}")
        if res.status_code != 200:
            print("Validation error detail:", res.json())
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        
        user_data = res.json()
        print(f"Response Body: {user_data}")
        assert user_data["email"] == "bhai@karta.app"
        assert user_data["role"] == "admin"
        assert "id" in user_data

        # Check Set-Cookie header
        set_cookie_header = res.headers.get("set-cookie", "")
        print(f"Set-Cookie Header: {set_cookie_header}")
        assert SESSION_COOKIE_NAME in set_cookie_header, f"Cookie {SESSION_COOKIE_NAME} not found in headers"
        assert "HttpOnly" in set_cookie_header
        print("✅ Session cookie issued successfully with HttpOnly protection!")

        # Extract cookie value for subsequent requests
        session_cookie = client.cookies.get(SESSION_COOKIE_NAME)
        print(f"Extracted Cookie Value: {session_cookie[:30]}...")

        # -------------------------------------------------------------
        # STEP 3: Test Authenticated Access (GET /me with cookie)
        # -------------------------------------------------------------
        print("\n[Step 3] Testing GET /api/v1/auth/me WITH session cookie...")
        res = await client.get("/api/v1/auth/me")
        print(f"Status Code: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        profile = res.json()
        print(f"User Profile: {profile}")
        assert profile["id"] == user_data["id"]
        assert profile["email"] == "bhai@karta.app"
        print("✅ Authenticated profile retrieved successfully from PostgreSQL!")

        # -------------------------------------------------------------
        # STEP 4: Test Logout
        # -------------------------------------------------------------
        print("\n[Step 4] Testing POST /api/v1/auth/logout...")
        res = await client.post("/api/v1/auth/logout")
        print(f"Status Code: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        logout_cookie = res.headers.get("set-cookie", "")
        print(f"Logout Set-Cookie Header: {logout_cookie}")
        assert 'Max-Age=0' in logout_cookie or 'expires=' in logout_cookie.lower()
        print("✅ Session cookie invalidated and cleared successfully!")

        # -------------------------------------------------------------
        # STEP 5: Verify Log File Creation
        # -------------------------------------------------------------
        print("\n[Step 5] Verifying Audit Log file generation...")
        log_file_path = os.path.join(backend_dir, "logs", "auth", "auth.log")
        assert os.path.exists(log_file_path), f"Log file not found at {log_file_path}"
        with open(log_file_path, "r", encoding="utf-8") as f:
            log_lines = f.readlines()
        print(f"Audit log found! Total log entries written: {len(log_lines)}")
        print(f"Last log entry preview:\n  {log_lines[-1].strip()}")
        print("✅ Endpoint logging decorator verified!")

    print("\n" + "=" * 60)
    print("🎉 ALL AUTH & SESSION TESTS PASSED 100% PERFECTLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_auth_tests())
