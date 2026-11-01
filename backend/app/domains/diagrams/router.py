"""
RESTful API Router for Diagrams Domain.

Adheres to:
- Rule 10 RESTful standards:
  - URLs: /api/v1/projects/{project_id}/diagrams & /api/v1/diagrams/{slug} (Nouns only)
  - HTTP verbs determine actions (GET, POST, PATCH, DELETE)
- Unguessable random slugs (/d/{slug}) per karta_security.md Layer 3
- Optimistic Concurrency Control (expected_revision check on command apply)
- Deny-first capability checks (PermissionChecker & Capability registry)
- Mandatory @log_endpoint decorator on every single route
"""
from datetime import datetime, timezone
import secrets
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.capabilities import Capability
from app.core.commands.base import (
    ColumnDef,
    CommandError,
    DiagramState,
    ForeignKeyDef,
    TableDef,
)
from app.core.commands.schema_commands import AddTableCommand
from app.core.permissions import PermissionChecker
from app.dependencies import get_current_user, get_current_user_optional
from app.domains.diagrams.models import Diagram, DiagramRevision
from app.domains.diagrams.schemas import (
    DiagramCreate,
    DiagramDetailResponse,
    DiagramRevisionResponse,
    DiagramSummaryResponse,
    DiagramUpdate,
    ExecuteCommandRequest,
)
from app.domains.projects.models import Project
from app.domains.users.models import User
from app.domains.workspaces.models import Workspace, WorkspaceMember
from app.infra.database import get_db
from app.services.log_service import log_endpoint

# Create two routers: one for project-nested creation/listing, one for slug-based canvas actions
project_diagrams_router = APIRouter(prefix="/api/v1/projects/{project_id}/diagrams", tags=["Diagrams"])
diagrams_router = APIRouter(prefix="/api/v1/diagrams", tags=["Diagrams"])

# Registry of supported Diagram Commands
COMMAND_REGISTRY: dict[str, type] = {
    "add_table": AddTableCommand,
}


def _generate_diagram_slug() -> str:
    """Generate an unguessable random slug for diagram URLs (e.g. 'd_9xK2mP1q')."""
    raw_token = secrets.token_urlsafe(6).replace("-", "").replace("_", "")
    return f"d_{raw_token[:8]}"


async def _get_project_and_verify_membership(
    project_id: int,
    user_id: int,
    db: AsyncSession,
) -> tuple[Project, Workspace, str]:
    """Helper: Verifies project and workspace exist, and user is an active workspace member."""
    proj_res = await db.execute(select(Project).where(Project.id == project_id))
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    ws_res = await db.execute(select(Workspace).where(Workspace.id == project.workspace_id))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    mem_res = await db.execute(
        select(WorkspaceMember.role).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user_id
        )
    )
    user_role = mem_res.scalar_one_or_none()
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this workspace"
        )

    return project, workspace, user_role


async def _get_diagram_and_check_access(
    slug: str,
    user: User | None,
    db: AsyncSession,
    require_edit: bool = False,
) -> tuple[Diagram, str]:
    """
    Helper: Fetches diagram by slug, evaluates public vs private access, and checks user capability.
    Returns (Diagram, user_role).
    """
    stmt = (
        select(Diagram)
        .options(selectinload(Diagram.project))
        .where(Diagram.slug == slug)
    )
    diag_res = await db.execute(stmt)
    diagram = diag_res.scalar_one_or_none()
    if not diagram:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagram not found")

    project = diagram.project
    user_role = "viewer"

    if user:
        mem_res = await db.execute(
            select(WorkspaceMember.role).where(
                WorkspaceMember.workspace_id == project.workspace_id,
                WorkspaceMember.user_id == user.id
            )
        )
        found_role = mem_res.scalar_one_or_none()
        if found_role:
            user_role = found_role

    # Access Authorization Check
    if not diagram.is_public:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to view this private diagram"
            )
        if user_role not in {"owner", "editor", "viewer"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not a member of this workspace"
            )

    if require_edit:
        if not PermissionChecker.is_permitted(user_role, Capability.EDIT_DIAGRAM):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: You do not have permission to modify this diagram"
            )

    return diagram, user_role


# -----------------------------------------------------------------------------
# 1. List Diagrams inside a Project
# -----------------------------------------------------------------------------
@project_diagrams_router.get(
    "",
    response_model=list[DiagramSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List all diagrams in a project",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def list_project_diagrams(
    project_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all diagrams belonging to the specified project."""
    await _get_project_and_verify_membership(project_id, current_user.id, db)

    stmt = (
        select(Diagram)
        .where(Diagram.project_id == project_id)
        .order_by(Diagram.created_at.desc())
    )
    results = (await db.execute(stmt)).scalars().all()
    return results


# -----------------------------------------------------------------------------
# 2. Create a New Diagram in a Project
# -----------------------------------------------------------------------------
@project_diagrams_router.post(
    "",
    response_model=DiagramDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new diagram in a project",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def create_diagram(
    project_id: int,
    payload: DiagramCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new diagram canvas and initialize Revision 1 with empty schema/layout snapshots.
    Requires Capability.EDIT_DIAGRAM.
    """
    _, _, user_role = await _get_project_and_verify_membership(project_id, current_user.id, db)

    if not PermissionChecker.is_permitted(user_role, Capability.EDIT_DIAGRAM):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Viewers cannot create diagrams"
        )

    slug = _generate_diagram_slug()

    # 1. Create Diagram record
    diagram = Diagram(
        project_id=project_id,
        name=payload.name,
        type=payload.type,
        slug=slug,
        creator_id=current_user.id,
        is_public=payload.is_public,
        current_revision=1,
    )
    db.add(diagram)
    await db.flush()

    # 2. Initialize Revision 1 with clean empty snapshots
    initial_schema = {"tables": {}, "foreign_keys": []}
    initial_layout = {"nodes": {}}

    rev1 = DiagramRevision(
        diagram_id=diagram.id,
        revision_no=1,
        command_type="init_diagram",
        command_data={},
        schema_snapshot=initial_schema,
        layout_snapshot=initial_layout,
        actor_id=current_user.id,
    )
    db.add(rev1)
    await db.commit()
    await db.refresh(diagram)

    return DiagramDetailResponse(
        id=diagram.id,
        project_id=diagram.project_id,
        name=diagram.name,
        type=diagram.type,
        slug=diagram.slug,
        creator_id=diagram.creator_id,
        is_public=diagram.is_public,
        current_revision=diagram.current_revision,
        created_at=diagram.created_at,
        updated_at=diagram.updated_at,
        schema_snapshot=initial_schema,
        layout_snapshot=initial_layout,
        user_role=user_role,
    )


# -----------------------------------------------------------------------------
# 3. Get Diagram Canvas by Slug (Main Canvas Loader)
# -----------------------------------------------------------------------------
@diagrams_router.get(
    "/{slug}",
    response_model=DiagramDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get diagram canvas state and latest snapshots by slug",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def get_diagram_by_slug(
    slug: str,
    request: Request,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Main React Flow Canvas loader endpoint.
    Retrieves latest schema and layout snapshots.
    Public diagrams allow read-only access to unauthenticated visitors.
    """
    diagram, user_role = await _get_diagram_and_check_access(slug, current_user, db, require_edit=False)

    # Fetch latest revision snapshots
    rev_stmt = (
        select(DiagramRevision)
        .where(
            DiagramRevision.diagram_id == diagram.id,
            DiagramRevision.revision_no == diagram.current_revision
        )
    )
    rev = (await db.execute(rev_stmt)).scalar_one_or_none()

    schema_snapshot = rev.schema_snapshot if rev else {"tables": {}, "foreign_keys": []}
    layout_snapshot = rev.layout_snapshot if rev else {"nodes": {}}

    return DiagramDetailResponse(
        id=diagram.id,
        project_id=diagram.project_id,
        name=diagram.name,
        type=diagram.type,
        slug=diagram.slug,
        creator_id=diagram.creator_id,
        is_public=diagram.is_public,
        current_revision=diagram.current_revision,
        created_at=diagram.created_at,
        updated_at=diagram.updated_at,
        schema_snapshot=schema_snapshot,
        layout_snapshot=layout_snapshot,
        user_role=user_role,
    )


# -----------------------------------------------------------------------------
# 4. Update Diagram Metadata (Rename or Toggle Public)
# -----------------------------------------------------------------------------
@diagrams_router.patch(
    "/{slug}",
    response_model=DiagramSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update diagram metadata",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def update_diagram(
    slug: str,
    payload: DiagramUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update diagram display name or public sharing status. Requires Capability.EDIT_DIAGRAM."""
    diagram, _ = await _get_diagram_and_check_access(slug, current_user, db, require_edit=True)

    if payload.name is not None:
        diagram.name = payload.name
    if payload.is_public is not None:
        diagram.is_public = payload.is_public

    await db.commit()
    await db.refresh(diagram)
    return diagram


# -----------------------------------------------------------------------------
# 5. Delete Diagram
# -----------------------------------------------------------------------------
@diagrams_router.delete(
    "/{slug}",
    status_code=status.HTTP_200_OK,
    summary="Delete a diagram",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def delete_diagram(
    slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete diagram. Requires Capability.EDIT_DIAGRAM."""
    diagram, _ = await _get_diagram_and_check_access(slug, current_user, db, require_edit=True)
    await db.delete(diagram)
    await db.commit()
    return {"status": "ok", "message": "Diagram deleted successfully"}


# -----------------------------------------------------------------------------
# 6. Execute Diagram Command (Command Pattern & Optimistic Concurrency)
# -----------------------------------------------------------------------------
@diagrams_router.post(
    "/{slug}/commands",
    response_model=DiagramDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute a structured command on the diagram state",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def execute_diagram_command(
    slug: str,
    payload: ExecuteCommandRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a structured Diagram Command (e.g. 'add_table').
    
    ---------------------------------------------------------------------------
    OPTIMISTIC CONCURRENCY CONTROL:
    If another collaborator updated the diagram before this request arrived,
    expected_revision != diagram.current_revision.
    In this case, the server rejects with 409 Conflict so the client can resync!
    ---------------------------------------------------------------------------
    """
    diagram, user_role = await _get_diagram_and_check_access(slug, current_user, db, require_edit=True)

    # 1. Optimistic Concurrency Check
    if payload.expected_revision != diagram.current_revision:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Conflict detected: Diagram is at revision {diagram.current_revision}, "
                f"but client expected revision {payload.expected_revision}. Please resync."
            )
        )

    # 2. Lookup command class in Registry (Open/Closed Principle)
    cmd_class = COMMAND_REGISTRY.get(payload.command_type)
    if not cmd_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown command_type '{payload.command_type}'"
        )

    # 3. Load current accepted state snapshots
    rev_stmt = (
        select(DiagramRevision)
        .where(
            DiagramRevision.diagram_id == diagram.id,
            DiagramRevision.revision_no == diagram.current_revision
        )
    )
    latest_rev = (await db.execute(rev_stmt)).scalar_one()

    # Reconstitute in-memory DiagramState
    raw_tables = latest_rev.schema_snapshot.get("tables", {})
    tables_map = {
        name: TableDef(**tbl_dict)
        for name, tbl_dict in raw_tables.items()
    }
    raw_fks = latest_rev.schema_snapshot.get("foreign_keys", [])
    fks_list = [ForeignKeyDef(**fk_dict) for fk_dict in raw_fks]
    current_state = DiagramState(
        tables=tables_map,
        foreign_keys=fks_list,
        layout=latest_rev.layout_snapshot,
    )

    # 4. Instantiate and validate command
    command_id = f"cmd_{secrets.token_urlsafe(12)}"
    try:
        cmd_instance = cmd_class(
            command_id=command_id,
            diagram_id=diagram.id,
            actor_id=current_user.id,
            **payload.command_data,
        )
        cmd_instance.validate(current_state)
        new_state = cmd_instance.apply(current_state)
    except CommandError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err.message
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid command payload: {str(err)}"
        )

    # 5. Advance revision and persist snapshots
    diagram.current_revision += 1

    new_schema_snapshot = {
        "tables": {k: v.model_dump() for k, v in new_state.tables.items()},
        "foreign_keys": [fk.model_dump() for fk in new_state.foreign_keys],
    }
    new_layout_snapshot = new_state.layout

    new_revision = DiagramRevision(
        diagram_id=diagram.id,
        revision_no=diagram.current_revision,
        command_type=payload.command_type,
        command_data=payload.command_data,
        schema_snapshot=new_schema_snapshot,
        layout_snapshot=new_layout_snapshot,
        actor_id=current_user.id,
    )
    db.add(new_revision)
    await db.commit()
    await db.refresh(diagram)

    return DiagramDetailResponse(
        id=diagram.id,
        project_id=diagram.project_id,
        name=diagram.name,
        type=diagram.type,
        slug=diagram.slug,
        creator_id=diagram.creator_id,
        is_public=diagram.is_public,
        current_revision=diagram.current_revision,
        created_at=diagram.created_at,
        updated_at=diagram.updated_at,
        schema_snapshot=new_schema_snapshot,
        layout_snapshot=new_layout_snapshot,
        user_role=user_role,
    )


# -----------------------------------------------------------------------------
# 7. List Revision History Timeline
# -----------------------------------------------------------------------------
@diagrams_router.get(
    "/{slug}/revisions",
    response_model=list[DiagramRevisionResponse],
    status_code=status.HTTP_200_OK,
    summary="List revision history timeline for a diagram",
)
@log_endpoint(folder_name="diagrams", file_name="diagrams.log")
async def list_diagram_revisions(
    slug: str,
    request: Request,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full revision history timeline for audit and time-travel inspection."""
    diagram, _ = await _get_diagram_and_check_access(slug, current_user, db, require_edit=False)

    stmt = (
        select(DiagramRevision)
        .where(DiagramRevision.diagram_id == diagram.id)
        .order_by(DiagramRevision.revision_no.desc())
    )
    revisions = (await db.execute(stmt)).scalars().all()
    return revisions
