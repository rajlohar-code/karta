"""
Integration Tests for PBAC Collaborator Endpoints & Privacy Management.

Tests:
1. Listing collaborators returns `is_owner` and 13 PBAC permissions.
2. Updating collaborator permissions via PATCH.
3. Guard: Primary owner cannot have permissions modified (400).
4. Guard: Primary owner cannot be removed from workspace (400).
5. Removing regular collaborator via DELETE succeeds (200).
6. Assigning collaborators to private project via PUT succeeds (200).
7. Assigning collaborators to private diagram via PUT succeeds (200).
"""
import pytest
from httpx import AsyncClient


async def create_user_and_workspace(client: AsyncClient, email: str = "pbac.owner@karta.app"):
    """Helper to register user and obtain default workspace."""
    # Register/login user via dev auth
    login_resp = await client.post("/api/v1/auth/dev-session", json={"email": email, "name": "PBAC Owner"})
    assert login_resp.status_code == 200

    # Create a workspace
    ws_resp = await client.post("/api/v1/workspaces", json={"name": "PBAC Test Space"})
    assert ws_resp.status_code == 201
    return ws_resp.json()


@pytest.mark.anyio
async def test_list_members_returns_owner_and_pbac_permissions(client: AsyncClient):
    """Listing workspace members returns `is_owner: True` for creator and 13 PBAC permissions."""
    workspace = await create_user_and_workspace(client, "owner.list@karta.app")
    slug = workspace["slug"]

    resp = await client.get(f"/api/v1/workspaces/{slug}/members")
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) >= 1

    owner = next(m for m in members if m["email"] == "owner.list@karta.app")
    assert owner["is_owner"] is True
    assert "can_view_public_diagrams" in owner["permissions"]
    assert "can_create_schemas" in owner["permissions"]
    assert len(owner["permissions"]) == 13


@pytest.mark.anyio
async def test_update_member_permissions_and_owner_guards(client: AsyncClient):
    """Updating regular member permissions works, but updating owner is blocked."""
    workspace = await create_user_and_workspace(client, "owner.perms@karta.app")
    slug = workspace["slug"]

    # 1. Add a second user as collaborator
    # First create second user in DB via dev login
    await client.post("/api/v1/auth/dev-session", json={"email": "member.two@karta.app", "name": "Member Two"})
    # Re-login as owner
    await client.post("/api/v1/auth/dev-session", json={"email": "owner.perms@karta.app", "name": "PBAC Owner"})

    add_resp = await client.post(f"/api/v1/workspaces/{slug}/members", json={"email": "member.two@karta.app", "role": "editor"})
    assert add_resp.status_code == 201
    member = add_resp.json()
    member_user_id = member["user_id"]

    # 2. Update member permissions: grant can_create_schemas = True
    new_perms = {
        "can_view_public_diagrams": True,
        "can_create_schemas": True,
        "can_create_flowcharts": True,
        "can_create_public_diagrams": True,
        "can_edit_public_schemas": True,
        "can_edit_private_diagrams_if_added": True,
        "can_create_public_projects": True,
        "can_create_private_projects": True,
        "can_add_members_to_private_projects_if_added": True,
        "can_use_readonly_ai": True,
        "can_use_ai_generation": True,
        "can_view_permissions": True,
        "can_edit_permissions": True,
    }
    patch_resp = await client.patch(
        f"/api/v1/workspaces/{slug}/members/{member_user_id}/permissions",
        json={"permissions": new_perms}
    )
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert updated_data["permissions"]["can_create_schemas"] is True
    assert updated_data["permissions"]["can_edit_permissions"] is True

    # 3. Guard: Cannot modify creator/owner's permissions
    owner_id = workspace["owner_id"]
    guard_resp = await client.patch(
        f"/api/v1/workspaces/{slug}/members/{owner_id}/permissions",
        json={"permissions": new_perms}
    )
    assert guard_resp.status_code == 400
    assert "creator" in guard_resp.json()["detail"].lower()


@pytest.mark.anyio
async def test_remove_member_and_owner_delete_guard(client: AsyncClient):
    """Owner cannot be deleted, but regular collaborator can be removed."""
    workspace = await create_user_and_workspace(client, "owner.del@karta.app")
    slug = workspace["slug"]

    # Create collaborator
    await client.post("/api/v1/auth/dev-session", json={"email": "removable@karta.app", "name": "Removable User"})
    await client.post("/api/v1/auth/dev-session", json={"email": "owner.del@karta.app", "name": "PBAC Owner"})

    add_resp = await client.post(f"/api/v1/workspaces/{slug}/members", json={"email": "removable@karta.app"})
    assert add_resp.status_code == 201
    user_id = add_resp.json()["user_id"]

    # 1. Guard: Owner cannot remove themselves/creator
    owner_id = workspace["owner_id"]
    del_owner_resp = await client.delete(f"/api/v1/workspaces/{slug}/members/{owner_id}")
    assert del_owner_resp.status_code == 400
    assert "creator cannot be removed" in del_owner_resp.json()["detail"].lower()

    # 2. Removing collaborator succeeds
    del_resp = await client.delete(f"/api/v1/workspaces/{slug}/members/{user_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["user_id"] == user_id


@pytest.mark.anyio
async def test_update_private_resource_members(client: AsyncClient):
    """Assigning collaborators to private project and private diagram succeeds."""
    workspace = await create_user_and_workspace(client, "resource.owner@karta.app")
    slug = workspace["slug"]

    # 1. Create a private project
    proj_resp = await client.post(
        f"/api/v1/workspaces/{slug}/projects",
        json={"name": "Confidential Project", "is_public": False}
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]
    assert proj_resp.json()["is_public"] is False

    # 2. Assign collaborator IDs to project
    put_proj_resp = await client.put(
        f"/api/v1/workspaces/{slug}/projects/{project_id}/members",
        json={"member_user_ids": [10, 20]}
    )
    assert put_proj_resp.status_code == 200
    assert put_proj_resp.json()["member_user_ids"] == [10, 20]

    # 3. Create a private diagram inside project
    diag_resp = await client.post(
        f"/api/v1/projects/{project_id}/diagrams",
        json={"name": "Confidential Schema", "is_public": False}
    )
    assert diag_resp.status_code == 201
    diag_slug = diag_resp.json()["slug"]

    # 4. Assign collaborator IDs to diagram
    put_diag_resp = await client.put(
        f"/api/v1/diagrams/{diag_slug}/members",
        json={"member_user_ids": [10, 30]}
    )
    assert put_diag_resp.status_code == 200
    assert put_diag_resp.json()["member_user_ids"] == [10, 30]
