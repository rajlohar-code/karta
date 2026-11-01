"""
Integration Tests for Workspaces RESTful APIs & Collaboration.

Endpoints Tested:
- GET    /api/v1/workspaces
- POST   /api/v1/workspaces
- GET    /api/v1/workspaces/{slug}
- PATCH  /api/v1/workspaces/{slug}
- GET    /api/v1/workspaces/{slug}/members
- POST   /api/v1/workspaces/{slug}/members
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_cannot_list_workspaces(client: AsyncClient):
    """Security Guard: Unauthenticated requests must receive 401."""
    res = await client.get("/api/v1/workspaces")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_and_fetch_workspace_flow(client: AsyncClient):
    """
    Lifecycle Test:
    1. Authenticate user.
    2. Create a new workspace.
    3. Verify unguessable slug generation and owner role.
    4. Fetch workspace by slug.
    5. Verify workspace appears in user's workspace list.
    """
    # 1. Authenticate
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "creator@karta.app", "name": "Creator Dev", "role": "user"}
    )

    # 2. Create Workspace
    create_res = await client.post(
        "/api/v1/workspaces",
        json={"name": "Fintech Architecture"}
    )
    assert create_res.status_code == 201
    ws = create_res.json()
    assert ws["name"] == "Fintech Architecture"
    assert ws["slug"].startswith("w_")
    assert ws["user_role"] == "owner"
    slug = ws["slug"]

    # 3. Fetch Single Workspace by Slug
    get_res = await client.get(f"/api/v1/workspaces/{slug}")
    assert get_res.status_code == 200
    fetched_ws = get_res.json()
    assert fetched_ws["id"] == ws["id"]
    assert fetched_ws["name"] == "Fintech Architecture"
    assert fetched_ws["user_role"] == "owner"

    # 4. List All My Workspaces
    list_res = await client.get("/api/v1/workspaces")
    assert list_res.status_code == 200
    workspaces = list_res.json()
    slugs = [w["slug"] for w in workspaces]
    assert slug in slugs


@pytest.mark.asyncio
async def test_update_workspace_name(client: AsyncClient):
    """
    Owner Capability Test:
    Owner can rename their workspace using PATCH.
    """
    # 1. Authenticate & Create
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "owner@karta.app", "name": "Owner User", "role": "user"}
    )
    res = await client.post("/api/v1/workspaces", json={"name": "Initial Name"})
    slug = res.json()["slug"]

    # 2. Update Name
    patch_res = await client.patch(
        f"/api/v1/workspaces/{slug}",
        json={"name": "Updated Super Workspace"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Super Workspace"


@pytest.mark.asyncio
async def test_non_member_access_is_forbidden(client: AsyncClient):
    """
    Security Test (IDOR / Multi-tenant isolation):
    User B must NOT be able to view or edit User A's private workspace.
    """
    # 1. User A logs in and creates a workspace
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "user.a@karta.app", "name": "User A", "role": "user"}
    )
    res_a = await client.post("/api/v1/workspaces", json={"name": "User A Private"})
    slug_a = res_a.json()["slug"]

    # 2. User B logs in (switching session)
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "user.b@karta.app", "name": "User B", "role": "user"}
    )

    # 3. User B attempts to access User A's workspace
    forbidden_res = await client.get(f"/api/v1/workspaces/{slug_a}")
    assert forbidden_res.status_code == 403
    assert "Access denied" in forbidden_res.json()["detail"]


@pytest.mark.asyncio
async def test_invite_member_and_collaborate(client: AsyncClient):
    """
    Collaboration Test:
    1. Owner creates workspace.
    2. Owner invites a colleague as 'editor'.
    3. Colleague logs in and can now access the workspace with 'editor' role.
    """
    # 1. Ensure colleague user exists in DB first
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "colleague@karta.app", "name": "Colleague Dev", "role": "user"}
    )

    # 2. Owner logs in & creates workspace
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "team.lead@karta.app", "name": "Team Lead", "role": "user"}
    )
    ws_res = await client.post("/api/v1/workspaces", json={"name": "Team Space"})
    slug = ws_res.json()["slug"]

    # 3. Owner invites colleague
    invite_res = await client.post(
        f"/api/v1/workspaces/{slug}/members",
        json={"email": "colleague@karta.app", "role": "editor"}
    )
    assert invite_res.status_code == 201
    member_data = invite_res.json()
    assert member_data["email"] == "colleague@karta.app"
    assert member_data["role"] == "editor"

    # 4. Check members list
    members_res = await client.get(f"/api/v1/workspaces/{slug}/members")
    assert members_res.status_code == 200
    emails = [m["email"] for m in members_res.json()]
    assert "team.lead@karta.app" in emails
    assert "colleague@karta.app" in emails

    # 5. Colleague logs in and visits workspace
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "colleague@karta.app", "name": "Colleague Dev", "role": "user"}
    )
    colleague_view = await client.get(f"/api/v1/workspaces/{slug}")
    assert colleague_view.status_code == 200
    assert colleague_view.json()["user_role"] == "editor"
