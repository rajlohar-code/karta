"""
RESTful API Router for Projects Domain.

Adheres to:
- Rule 10 RESTful standards:
  - URLs: /api/v1/workspaces/{slug}/projects (Hierarchical parent-child nesting, nouns only)
  - HTTP verbs determine actions (GET, POST, PATCH, DELETE)
- Deny-first capability authorization (PermissionChecker)
- Mandatory @log_endpoint decorator on every single route
- Full docstrings detailing purpose, request payload, and response JSON
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.capabilities import Capability
from app.core.permissions import PermissionChecker
from app.dependencies import get_current_user
from app.domains.diagrams.models import Diagram
from app.domains.projects.models import Project, ProjectMember
from app.domains.projects.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    UpdateResourceMembersRequest,
)
from app.domains.users.models import User
from app.domains.workspaces.models import Workspace, WorkspaceMember
from app.infra.database import get_db
from app.services.log_service import log_endpoint

# Create router with hierarchical RESTful prefix
router = APIRouter(prefix="/api/v1/workspaces/{slug}/projects", tags=["Projects"])


async def _get_workspace_and_verify_membership(
    slug: str,
    user_id: int,
    db: AsyncSession,
) -> tuple[Workspace, str]:
    """
    Helper: Verifies workspace exists and user is an active member.
    Returns (Workspace, user_role).
    Raises 404 if workspace doesn't exist, 403 if user is not a member.
    """
    ws_res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

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

    return workspace, user_role


# -----------------------------------------------------------------------------
# 1. List All Projects in a Workspace
# -----------------------------------------------------------------------------
@router.get(
    "",
    response_model=list[ProjectResponse],
    status_code=status.HTTP_200_OK,
    summary="List all projects inside a workspace",
)
@log_endpoint(folder_name="projects", file_name="projects.log")
async def list_workspace_projects(
    slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all projects belonging to the specified workspace along with diagrams count.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Populates the projects grid / list when a user opens a workspace in the frontend.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: GET
      - URL        : /api/v1/workspaces/{slug}/projects
      - Headers    : Cookie: karta_session=...
      - Payload    : None
      
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 200 OK
      - Body JSON Example:
        ```json
        [
          {
            "id": 1,
            "workspace_id": 1,
            "name": "Payments Microservice",
            "description": "Schemas and flowcharts for Razorpay integration",
            "created_at": "2026-11-01T12:00:00Z",
            "updated_at": "2026-11-01T12:00:00Z",
            "diagrams_count": 3
          }
        ]
        ```
    ---------------------------------------------------------------------------
    """
    workspace, _ = await _get_workspace_and_verify_membership(slug, current_user.id, db)

    # Query projects with subquery count of diagrams
    stmt = (
        select(
            Project,
            func.count(Diagram.id).label("diagrams_count")
        )
        .outerjoin(Diagram, Project.id == Diagram.project_id)
        .where(Project.workspace_id == workspace.id)
        .group_by(Project.id)
        .order_by(Project.is_pinned.desc(), Project.created_at.desc())
    )
    results = (await db.execute(stmt)).all()

    # Query assigned members for all projects in this workspace
    project_ids = [proj.id for proj, _ in results]
    members_map: dict[int, list[int]] = {pid: [] for pid in project_ids}
    if project_ids:
        mem_rows = (await db.execute(
            select(ProjectMember.project_id, ProjectMember.user_id)
            .where(ProjectMember.project_id.in_(project_ids))
        )).all()
        for pid, uid in mem_rows:
            members_map[pid].append(uid)

    return [
        ProjectResponse(
            id=proj.id,
            workspace_id=proj.workspace_id,
            name=proj.name,
            description=proj.description,
            is_pinned=proj.is_pinned,
            is_public=proj.is_public,
            member_user_ids=members_map.get(proj.id, []),
            created_at=proj.created_at,
            updated_at=proj.updated_at,
            diagrams_count=count,
        )
        for proj, count in results
    ]


# -----------------------------------------------------------------------------
# 2. Create a New Project in a Workspace
# -----------------------------------------------------------------------------
@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project in a workspace",
)
@log_endpoint(folder_name="projects", file_name="projects.log")
async def create_project(
    slug: str,
    payload: ProjectCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project folder inside the workspace.
    Requires Capability.EDIT_DIAGRAM (Editor or Owner).
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Called when a user clicks '+ New Project' modal in the workspace view.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: POST
      - URL        : /api/v1/workspaces/{slug}/projects
      - Headers    : Cookie: karta_session=...
      - Payload JSON Example:
        ```json
        {
          "name": "Payments Microservice",
          "description": "Schemas and flowcharts for Razorpay integration"
        }
        ```
        
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 201 Created
      - Body JSON Example:
        ```json
        {
          "id": 1,
          "workspace_id": 1,
          "name": "Payments Microservice",
          "description": "Schemas and flowcharts for Razorpay integration",
          "created_at": "2026-11-01T12:00:00Z",
          "updated_at": "2026-11-01T12:00:00Z",
          "diagrams_count": 0
        }
        ```
    ---------------------------------------------------------------------------
    """
    workspace, user_role = await _get_workspace_and_verify_membership(slug, current_user.id, db)

    # Capability check: Viewers cannot create projects!
    if not PermissionChecker.is_permitted(user_role, Capability.EDIT_DIAGRAM):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Viewers cannot create projects"
        )

    project = Project(
        workspace_id=workspace.id,
        name=payload.name,
        description=payload.description,
        is_pinned=payload.is_pinned,
        is_public=payload.is_public,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ProjectResponse(
        id=project.id,
        workspace_id=project.workspace_id,
        name=project.name,
        description=project.description,
        is_pinned=project.is_pinned,
        is_public=project.is_public,
        member_user_ids=[],
        created_at=project.created_at,
        updated_at=project.updated_at,
        diagrams_count=0,
    )


# -----------------------------------------------------------------------------
# 3. Get Single Project Details
# -----------------------------------------------------------------------------
@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single project details by ID",
)
@log_endpoint(folder_name="projects", file_name="projects.log")
async def get_project(
    slug: str,
    project_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details for a single project including diagram count."""
    workspace, _ = await _get_workspace_and_verify_membership(slug, current_user.id, db)

    stmt = (
        select(Project, func.count(Diagram.id).label("diagrams_count"))
        .outerjoin(Diagram, Project.id == Diagram.project_id)
        .where(Project.id == project_id, Project.workspace_id == workspace.id)
        .group_by(Project.id)
    )
    res = (await db.execute(stmt)).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project, count = res

    # Query assigned members for this project
    mem_rows = (await db.execute(
        select(ProjectMember.user_id).where(ProjectMember.project_id == project.id)
    )).scalars().all()

    return ProjectResponse(
        id=project.id,
        workspace_id=project.workspace_id,
        name=project.name,
        description=project.description,
        is_pinned=project.is_pinned,
        is_public=project.is_public,
        member_user_ids=list(mem_rows),
        created_at=project.created_at,
        updated_at=project.updated_at,
        diagrams_count=count,
    )


# -----------------------------------------------------------------------------
# 4. Update Project Details
# -----------------------------------------------------------------------------
@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Update project metadata",
)
@log_endpoint(folder_name="projects", file_name="projects.log")
async def update_project(
    slug: str,
    project_id: int,
    payload: ProjectUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update project name, description, pinned status, or public/private toggle. Requires Capability.EDIT_DIAGRAM."""
    workspace, user_role = await _get_workspace_and_verify_membership(slug, current_user.id, db)

    if not PermissionChecker.is_permitted(user_role, Capability.EDIT_DIAGRAM):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    proj_res = await db.execute(
        select(Project).where(Project.id == project_id, Project.workspace_id == workspace.id)
    )
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.is_pinned is not None:
        project.is_pinned = payload.is_pinned
    if payload.is_public is not None:
        project.is_public = payload.is_public

    await db.commit()
    await db.refresh(project)

    # Count diagrams
    count_res = await db.execute(
        select(func.count(Diagram.id)).where(Diagram.project_id == project.id)
    )
    diagrams_count = count_res.scalar_one()

    # Query assigned members
    mem_rows = (await db.execute(
        select(ProjectMember.user_id).where(ProjectMember.project_id == project.id)
    )).scalars().all()

    return ProjectResponse(
        id=project.id,
        workspace_id=project.workspace_id,
        name=project.name,
        description=project.description,
        is_pinned=project.is_pinned,
        is_public=project.is_public,
        member_user_ids=list(mem_rows),
        created_at=project.created_at,
        updated_at=project.updated_at,
        diagrams_count=diagrams_count,
    )


# -----------------------------------------------------------------------------
# 5. Assign Collaborators to a Private Project
# -----------------------------------------------------------------------------
@router.put(
    "/{project_id}/members",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Update assigned collaborators on a private project",
)
@log_endpoint(folder_name="projects", file_name="projects.log")
async def update_project_members(
    slug: str,
    project_id: int,
    payload: UpdateResourceMembersRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Set explicit collaborator user IDs for a private project.
    Requires workspace creator OR 'can_add_members_to_private_projects_if_added'.
    """
    workspace, _ = await _get_workspace_and_verify_membership(slug, current_user.id, db)

    proj_res = await db.execute(
        select(Project).where(Project.id == project_id, Project.workspace_id == workspace.id)
    )
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Fetch current user membership
    curr_mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    curr_mem = curr_mem_res.scalar_one_or_none()

    # Permission check: Owner OR can_add_members_to_private_projects_if_added
    can_manage = (current_user.id == workspace.owner_id) or (
        curr_mem and curr_mem.permissions.get("can_add_members_to_private_projects_if_added", False) is True
    )
    if not can_manage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You do not have permission to manage private project collaborators"
        )

    # Delete existing project members
    from sqlalchemy import delete
    await db.execute(delete(ProjectMember).where(ProjectMember.project_id == project.id))

    # Add new project members
    for uid in payload.member_user_ids:
        db.add(ProjectMember(project_id=project.id, user_id=uid))

    await db.commit()
    await db.refresh(project)

    count_res = await db.execute(
        select(func.count(Diagram.id)).where(Diagram.project_id == project.id)
    )
    diagrams_count = count_res.scalar_one()

    return ProjectResponse(
        id=project.id,
        workspace_id=project.workspace_id,
        name=project.name,
        description=project.description,
        is_pinned=project.is_pinned,
        is_public=project.is_public,
        member_user_ids=payload.member_user_ids,
        created_at=project.created_at,
        updated_at=project.updated_at,
        diagrams_count=diagrams_count,
    )


# -----------------------------------------------------------------------------
# 5. Delete Project
# -----------------------------------------------------------------------------
@router.delete(
    "/{project_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a project and all its child diagrams",
)
@log_endpoint(folder_name="projects", file_name="projects.log")
async def delete_project(
    slug: str,
    project_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete project. Requires Capability.EDIT_DIAGRAM."""
    workspace, user_role = await _get_workspace_and_verify_membership(slug, current_user.id, db)

    if not PermissionChecker.is_permitted(user_role, Capability.EDIT_DIAGRAM):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    proj_res = await db.execute(
        select(Project).where(Project.id == project_id, Project.workspace_id == workspace.id)
    )
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.delete(project)
    await db.commit()

    return {"status": "ok", "message": "Project deleted successfully"}
