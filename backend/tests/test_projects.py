"""
Integration Tests for Projects Domain.

Endpoints Tested:
- GET    /api/v1/workspaces/{slug}/projects
- POST   /api/v1/workspaces/{slug}/projects
- GET    /api/v1/workspaces/{slug}/projects/{project_id}
- PATCH  /api/v1/workspaces/{slug}/projects/{project_id}
- DELETE /api/v1/workspaces/{slug}/projects/{project_id}
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_cannot_list_projects(client: AsyncClient):
    """Security Guard: Unauthenticated requests must receive 401."""
    res = await client.get("/api/v1/workspaces/w_fake_slug/projects")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_projects(client: AsyncClient):
    """
    Lifecycle Test:
    1. Authenticate user and create a workspace.
    2. Create a project inside the workspace.
    3. List projects and verify it is returned with diagrams_count = 0.
    4. Fetch single project by ID.
    """
    # 1. Authenticate & create workspace
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "proj.creator@karta.app", "name": "Project Creator", "role": "user"}
    )
    ws_res = await client.post("/api/v1/workspaces", json={"name": "Fintech Space"})
    slug = ws_res.json()["slug"]

    # 2. Create Project
    create_res = await client.post(
        f"/api/v1/workspaces/{slug}/projects",
        json={
            "name": "Payments Service",
            "description": "Razorpay and Stripe webhook processors"
        }
    )
    assert create_res.status_code == 201
    proj_data = create_res.json()
    assert proj_data["name"] == "Payments Service"
    assert proj_data["description"] == "Razorpay and Stripe webhook processors"
    assert proj_data["diagrams_count"] == 0
    proj_id = proj_data["id"]

    # 3. List Projects
    list_res = await client.get(f"/api/v1/workspaces/{slug}/projects")
    assert list_res.status_code == 200
    projects = list_res.json()
    assert len(projects) >= 1
    assert any(p["id"] == proj_id for p in projects)

    # 4. Fetch Single Project
    get_res = await client.get(f"/api/v1/workspaces/{slug}/projects/{proj_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Payments Service"


@pytest.mark.asyncio
async def test_update_and_delete_project(client: AsyncClient):
    """
    Mutation Test:
    1. Create project.
    2. Update name via PATCH.
    3. Delete project via DELETE.
    4. Verify project is removed.
    """
    # 1. Setup workspace & project
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "modifier@karta.app", "name": "Modifier User", "role": "user"}
    )
    ws_res = await client.post("/api/v1/workspaces", json={"name": "Test Workspace"})
    slug = ws_res.json()["slug"]

    p_res = await client.post(
        f"/api/v1/workspaces/{slug}/projects",
        json={"name": "Initial Project Name"}
    )
    proj_id = p_res.json()["id"]

    # 2. Update via PATCH
    patch_res = await client.patch(
        f"/api/v1/workspaces/{slug}/projects/{proj_id}",
        json={"name": "Renamed Super Project", "description": "Updated notes"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Renamed Super Project"
    assert patch_res.json()["description"] == "Updated notes"

    # 3. Delete Project
    del_res = await client.delete(f"/api/v1/workspaces/{slug}/projects/{proj_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "ok"

    # 4. Confirm it is gone
    get_again = await client.get(f"/api/v1/workspaces/{slug}/projects/{proj_id}")
    assert get_again.status_code == 404


@pytest.mark.asyncio
async def test_pin_project_floats_to_top(client: AsyncClient):
    """Pinning Test: Pinned projects must appear at the top of the list."""
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "pinner@karta.app", "name": "Pin User", "role": "user"}
    )
    ws = (await client.post("/api/v1/workspaces", json={"name": "Pin Workspace"})).json()
    slug = ws["slug"]

    # Create project 1 (older, unpinned)
    p1 = (await client.post(f"/api/v1/workspaces/{slug}/projects", json={"name": "Project 1"})).json()

    # Create project 2 (newer, unpinned)
    p2 = (await client.post(f"/api/v1/workspaces/{slug}/projects", json={"name": "Project 2"})).json()

    # Pin project 1 via PATCH
    patch_res = await client.patch(
        f"/api/v1/workspaces/{slug}/projects/{p1['id']}",
        json={"is_pinned": True}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_pinned"] is True

    # List projects: P1 should be first even though P2 is newer!
    list_res = await client.get(f"/api/v1/workspaces/{slug}/projects")
    projects = list_res.json()
    assert projects[0]["id"] == p1["id"]
    assert projects[0]["is_pinned"] is True


@pytest.mark.asyncio
async def test_viewer_cannot_create_project(client: AsyncClient):
    """
    Capability Guard Test:
    Users with 'viewer' role must receive 403 Forbidden when attempting to create a project.
    """
    # 1. Owner creates workspace
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "owner.proj@karta.app", "name": "Owner Proj", "role": "user"}
    )
    ws_res = await client.post("/api/v1/workspaces", json={"name": "Restricted Workspace"})
    slug = ws_res.json()["slug"]

    # 2. Ensure viewer user exists and invite as viewer
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "viewer.user@karta.app", "name": "Viewer User", "role": "user"}
    )
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "owner.proj@karta.app", "name": "Owner Proj", "role": "user"}
    )
    await client.post(
        f"/api/v1/workspaces/{slug}/members",
        json={"email": "viewer.user@karta.app", "role": "viewer"}
    )

    # 3. Viewer logs in and attempts to create project
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "viewer.user@karta.app", "name": "Viewer User", "role": "user"}
    )
    create_attempt = await client.post(
        f"/api/v1/workspaces/{slug}/projects",
        json={"name": "Hacker Project"}
    )
    assert create_attempt.status_code == 403
    assert "Viewers cannot create projects" in create_attempt.json()["detail"]
