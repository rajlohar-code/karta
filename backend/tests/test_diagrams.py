"""
Integration Tests for Diagrams Domain, Command Engine & Optimistic Concurrency.

Endpoints Tested:
- GET    /api/v1/projects/{project_id}/diagrams
- POST   /api/v1/projects/{project_id}/diagrams
- GET    /api/v1/diagrams/{slug}
- PATCH  /api/v1/diagrams/{slug}
- POST   /api/v1/diagrams/{slug}/commands
- GET    /api/v1/diagrams/{slug}/revisions
- DELETE /api/v1/diagrams/{slug}
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_cannot_access_private_diagram(client: AsyncClient):
    """Security Guard: Unauthenticated access to private diagram returns 401."""
    # 1. Authenticate & create a private diagram
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "private.owner@karta.app", "name": "Private Owner", "role": "user"}
    )
    ws = (await client.post("/api/v1/workspaces", json={"name": "Secret Space"})).json()
    proj = (await client.post(f"/api/v1/workspaces/{ws['slug']}/projects", json={"name": "Secret Project"})).json()
    diag = (await client.post(
        f"/api/v1/projects/{proj['id']}/diagrams",
        json={"name": "Secret Diagram", "is_public": False}
    )).json()
    slug = diag["slug"]

    # 2. Logout (clear session cookie)
    await client.post("/api/v1/auth/logout")

    # 3. Try to access private diagram without cookie -> 401 Unauthorized!
    res = await client.get(f"/api/v1/diagrams/{slug}")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


@pytest.mark.asyncio
async def test_create_and_load_diagram_canvas(client: AsyncClient):
    """
    Lifecycle Test:
    1. Setup user, workspace, and project.
    2. Create a new diagram canvas.
    3. Verify unguessable slug generation, rev 1 initialization, and empty snapshots.
    4. Fetch canvas via GET /api/v1/diagrams/{slug}.
    """
    # 1. Setup
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "architect@karta.app", "name": "System Architect", "role": "user"}
    )
    ws_res = await client.post("/api/v1/workspaces", json={"name": "Cloud Platform"})
    ws_slug = ws_res.json()["slug"]

    proj_res = await client.post(
        f"/api/v1/workspaces/{ws_slug}/projects",
        json={"name": "Auth Core"}
    )
    proj_id = proj_res.json()["id"]

    # 2. Create Diagram
    create_res = await client.post(
        f"/api/v1/projects/{proj_id}/diagrams",
        json={
            "name": "User Auth Schema",
            "type": "schema",
            "is_public": False
        }
    )
    assert create_res.status_code == 201
    diag = create_res.json()
    assert diag["name"] == "User Auth Schema"
    assert diag["slug"].startswith("d_")
    assert diag["current_revision"] == 1
    assert diag["user_role"] == "owner"
    assert diag["schema_snapshot"] == {"tables": {}, "foreign_keys": []}
    assert diag["layout_snapshot"] == {"nodes": {}}
    slug = diag["slug"]

    # 3. Load Diagram Canvas
    get_res = await client.get(f"/api/v1/diagrams/{slug}")
    assert get_res.status_code == 200
    canvas = get_res.json()
    assert canvas["id"] == diag["id"]
    assert canvas["current_revision"] == 1


@pytest.mark.asyncio
async def test_execute_command_and_optimistic_concurrency(client: AsyncClient):
    """
    Command Pattern & Concurrency Test:
    1. Create diagram at revision 1.
    2. Execute AddTableCommand with expected_revision=1.
    3. Verify revision advances to 2, tables updated, and layout nodes assigned.
    4. Conflict Test: Second command with expected_revision=1 is rejected with 409 Conflict!
    """
    # 1. Setup diagram
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "lead.dev@karta.app", "name": "Lead Developer", "role": "user"}
    )
    ws = (await client.post("/api/v1/workspaces", json={"name": "Fintech Space"})).json()
    proj = (await client.post(f"/api/v1/workspaces/{ws['slug']}/projects", json={"name": "Core"})).json()
    diag = (await client.post(
        f"/api/v1/projects/{proj['id']}/diagrams",
        json={"name": "Database ERD", "type": "schema"}
    )).json()
    slug = diag["slug"]

    # 2. Execute AddTableCommand
    cmd_payload = {
        "command_type": "add_table",
        "expected_revision": 1,
        "command_data": {
            "table": {
                "name": "users",
                "columns": [
                    {"name": "id", "data_type": "serial", "is_primary_key": True},
                    {"name": "email", "data_type": "varchar(255)", "is_nullable": False}
                ],
                "description": "User accounts table"
            },
            "initial_x": 150.0,
            "initial_y": 200.0
        }
    }
    cmd_res = await client.post(f"/api/v1/diagrams/{slug}/commands", json=cmd_payload)
    assert cmd_res.status_code == 200
    updated_diag = cmd_res.json()

    # Verify state mutation
    assert updated_diag["current_revision"] == 2
    assert "users" in updated_diag["schema_snapshot"]["tables"]
    assert len(updated_diag["schema_snapshot"]["tables"]["users"]["columns"]) == 2
    assert updated_diag["layout_snapshot"]["nodes"]["users"]["x"] == 150.0
    assert updated_diag["layout_snapshot"]["nodes"]["users"]["y"] == 200.0

    # 3. Optimistic Concurrency Conflict Test
    # Client sends expected_revision=1 (outdated revision!), server must reject with 409!
    conflict_payload = {
        "command_type": "add_table",
        "expected_revision": 1,  # Stale revision!
        "command_data": {
            "table": {
                "name": "orders",
                "columns": [{"name": "id", "data_type": "serial"}]
            }
        }
    }
    conflict_res = await client.post(f"/api/v1/diagrams/{slug}/commands", json=conflict_payload)
    assert conflict_res.status_code == 409
    assert "Conflict detected" in conflict_res.json()["detail"]


@pytest.mark.asyncio
async def test_public_diagram_and_revision_history(client: AsyncClient):
    """
    Sharing & Audit Timeline Test:
    1. Owner creates diagram and makes it public.
    2. Unauthenticated visitor can view it in read-only mode (role='viewer').
    3. Timeline API lists full chronological revisions.
    """
    # 1. Setup
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "share.owner@karta.app", "name": "Share Owner", "role": "user"}
    )
    ws = (await client.post("/api/v1/workspaces", json={"name": "Public Space"})).json()
    proj = (await client.post(f"/api/v1/workspaces/{ws['slug']}/projects", json={"name": "Open Source"})).json()
    diag = (await client.post(
        f"/api/v1/projects/{proj['id']}/diagrams",
        json={"name": "Open Architecture", "is_public": True}
    )).json()
    slug = diag["slug"]

    # 2. Add table command to generate revision 2
    await client.post(
        f"/api/v1/diagrams/{slug}/commands",
        json={
            "command_type": "add_table",
            "expected_revision": 1,
            "command_data": {
                "table": {
                    "name": "metrics",
                    "columns": [{"name": "id", "data_type": "int"}]
                }
            }
        }
    )

    # 3. Logout (now unauthenticated)
    await client.post("/api/v1/auth/logout")

    # 4. Public visitor fetches diagram without authentication
    public_res = await client.get(f"/api/v1/diagrams/{slug}")
    assert public_res.status_code == 200
    public_diag = public_res.json()
    assert public_diag["is_public"] is True
    assert public_diag["user_role"] == "viewer"
    assert "metrics" in public_diag["schema_snapshot"]["tables"]

    # 5. Check Revision Timeline
    revs_res = await client.get(f"/api/v1/diagrams/{slug}/revisions")
    assert revs_res.status_code == 200
    revisions = revs_res.json()
    assert len(revisions) == 2
    # Newest revision first
    assert revisions[0]["revision_no"] == 2
    assert revisions[0]["command_type"] == "add_table"
    assert revisions[1]["revision_no"] == 1
    assert revisions[1]["command_type"] == "init_diagram"


@pytest.mark.asyncio
async def test_workspace_diagrams_listing_and_standalone_creation(client: AsyncClient):
    """
    Test workspace-level diagram endpoints:
    1. Create a workspace.
    2. Create a standalone diagram (no project) via POST /api/v1/workspaces/{slug}/diagrams.
    3. Create a project and a project-nested diagram.
    4. Fetch all workspace diagrams via GET /api/v1/workspaces/{slug}/diagrams.
    5. Verify both diagrams are returned with appropriate project_id and workspace_id.
    """
    # 1. Login
    await client.post(
        "/api/v1/auth/dev-session",
        json={"email": "ws.diagrams@karta.app", "name": "Workspace Diagrams Tester", "role": "user"}
    )
    ws = (await client.post("/api/v1/workspaces", json={"name": "Workspace Canvas Hub"})).json()
    slug = ws["slug"]

    # 2. Create standalone diagram directly in workspace
    standalone_res = await client.post(
        f"/api/v1/workspaces/{slug}/diagrams",
        json={"name": "Root Flowchart", "type": "flowchart", "is_public": False}
    )
    assert standalone_res.status_code == 201
    standalone_diag = standalone_res.json()
    assert standalone_diag["name"] == "Root Flowchart"
    assert standalone_diag["project_id"] is None
    assert standalone_diag["workspace_id"] == ws["id"]

    # 3. Create a project and a nested diagram
    proj = (await client.post(f"/api/v1/workspaces/{slug}/projects", json={"name": "Core Banking"})).json()
    nested_res = await client.post(
        f"/api/v1/workspaces/{slug}/diagrams",
        json={"name": "Ledger Schema", "type": "schema", "project_id": proj["id"]}
    )
    assert nested_res.status_code == 201
    nested_diag = nested_res.json()
    assert nested_diag["project_id"] == proj["id"]

    # 4. List all diagrams in this workspace
    list_res = await client.get(f"/api/v1/workspaces/{slug}/diagrams")
    assert list_res.status_code == 200
    all_diags = list_res.json()
    assert len(all_diags) == 2
    names = {d["name"] for d in all_diags}
    assert "Root Flowchart" in names
    assert "Ledger Schema" in names

    # 5. Verify standalone diagram can be fetched via GET /api/v1/diagrams/{slug}
    root_slug = standalone_diag["slug"]
    fetch_root = await client.get(f"/api/v1/diagrams/{root_slug}")
    assert fetch_root.status_code == 200
    assert fetch_root.json()["name"] == "Root Flowchart"

    # 6. Move standalone diagram into project
    move_to_proj = await client.patch(
        f"/api/v1/diagrams/{root_slug}",
        json={"project_id": proj["id"]}
    )
    assert move_to_proj.status_code == 200
    assert move_to_proj.json()["project_id"] == proj["id"]

    # 7. Move diagram back to workspace root (standalone)
    move_to_root = await client.patch(
        f"/api/v1/diagrams/{root_slug}",
        json={"project_id": None}
    )
    assert move_to_root.status_code == 200
    assert move_to_root.json()["project_id"] is None

    # 8. Duplicate diagram via POST /api/v1/diagrams/{slug}/duplicate
    dup_res = await client.post(f"/api/v1/diagrams/{root_slug}/duplicate")
    assert dup_res.status_code == 201
    dup_diag = dup_res.json()
    assert dup_diag["name"] == "Root Flowchart 2"
    assert dup_diag["slug"] != root_slug
    assert dup_diag["current_revision"] == 1
    assert dup_diag["type"] == "flowchart"
