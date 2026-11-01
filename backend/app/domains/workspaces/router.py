"""
RESTful API Router for Workspaces Domain.

Adheres to:
- Rule 10 RESTful standards (Nouns only: /api/v1/workspaces, HTTP verbs determine action)
- Unguessable random slugs (/w/{slug}) per karta_security.md Layer 3
- Deny-first capability checks (PermissionChecker & Capability registry)
- Mandatory @log_endpoint decorator on every single route
- Full docstrings with request and response JSON examples
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.capabilities import Capability
from app.core.permissions import PermissionChecker
from app.dependencies import get_current_user
from app.domains.users.models import User
from app.domains.workspaces.models import Workspace, WorkspaceMember
from app.domains.workspaces.schemas import (
    AddMemberRequest,
    WorkspaceCreate,
    WorkspaceMemberResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.infra.database import get_db
from app.services.log_service import log_endpoint

# Create router with RESTful prefix and OpenAPI tag
router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])


def _generate_workspace_slug() -> str:
    """
    Generate an unguessable random slug for workspace URLs.
    Example output: 'w_xK9mP2qR'
    """
    raw_token = secrets.token_urlsafe(6).replace("-", "").replace("_", "")
    return f"w_{raw_token[:8]}"


# -----------------------------------------------------------------------------
# 1. List Workspaces for Current User
# -----------------------------------------------------------------------------
@router.get(
    "",
    response_model=list[WorkspaceResponse],
    status_code=status.HTTP_200_OK,
    summary="List all workspaces the logged-in user belongs to",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def list_my_workspaces(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all workspaces where the current authenticated user is a member.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Populates the top-left Workspace Switcher dropdown in the React frontend.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: GET
      - URL        : /api/v1/workspaces
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
            "name": "Personal Workspace",
            "slug": "w_a8b9c0d1",
            "owner_id": 1,
            "created_at": "2026-11-01T12:00:00Z",
            "updated_at": "2026-11-01T12:00:00Z",
            "user_role": "owner"
          }
        ]
        ```
    ---------------------------------------------------------------------------
    """
    # 1. Query all WorkspaceMember records for this user along with parent Workspace
    stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
        .order_by(Workspace.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    # 2. Map ORM models to WorkspaceResponse schemas including the user's role
    workspaces: list[WorkspaceResponse] = []
    for workspace, role in rows:
        workspaces.append(
            WorkspaceResponse(
                id=workspace.id,
                name=workspace.name,
                slug=workspace.slug,
                owner_id=workspace.owner_id,
                created_at=workspace.created_at,
                updated_at=workspace.updated_at,
                user_role=role,
            )
        )

    return workspaces


# -----------------------------------------------------------------------------
# 2. Create New Workspace
# -----------------------------------------------------------------------------
@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def create_workspace(
    request: Request,
    payload: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new workspace and assign the creator as the 'owner'.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Called when a user clicks '+ Create Workspace' modal in the React dashboard.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: POST
      - URL        : /api/v1/workspaces
      - Headers    : Cookie: karta_session=...
      - Payload JSON Example:
        ```json
        {
          "name": "Fintech Architecture"
        }
        ```
        
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 201 Created
      - Body JSON Example:
        ```json
        {
          "id": 2,
          "name": "Fintech Architecture",
          "slug": "w_k9mP2qR4",
          "owner_id": 1,
          "created_at": "2026-11-01T12:30:00Z",
          "updated_at": "2026-11-01T12:30:00Z",
          "user_role": "owner"
        }
        ```
    ---------------------------------------------------------------------------
    """
    # 1. Generate unguessable random URL slug
    slug = _generate_workspace_slug()

    # 2. Create the Workspace record
    workspace = Workspace(
        name=payload.name,
        slug=slug,
        owner_id=current_user.id,
    )
    db.add(workspace)
    await db.flush()  # Flush to assign workspace.id before creating membership

    # 3. Create the initial WorkspaceMember record assigning current user as 'owner'
    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(membership)
    await db.commit()
    await db.refresh(workspace)

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        user_role="owner",
    )


# -----------------------------------------------------------------------------
# 3. Get Single Workspace Details by Slug
# -----------------------------------------------------------------------------
@router.get(
    "/{slug}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single workspace details by slug",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def get_workspace_by_slug(
    slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve workspace details by its unguessable random slug.
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Called when a user navigates to `/w/{slug}` in the React frontend.
    Verifies that the user is an authorized member of this workspace (Deny-First).
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: GET
      - URL        : /api/v1/workspaces/{slug}
      - Headers    : Cookie: karta_session=...
      - Payload    : None
      
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 200 OK
      - Body JSON Example:
        ```json
        {
          "id": 1,
          "name": "Fintech Architecture",
          "slug": "w_k9mP2qR4",
          "owner_id": 1,
          "created_at": "2026-11-01T12:30:00Z",
          "updated_at": "2026-11-01T12:30:00Z",
          "user_role": "owner"
        }
        ```
    ---------------------------------------------------------------------------
    """
    # 1. Fetch workspace by slug
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # 2. Check membership of current user (Deny-First authorization)
    member_res = await db.execute(
        select(WorkspaceMember.role).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    user_role = member_res.scalar_one_or_none()

    if not user_role:
        # User is not a member of this workspace
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this workspace"
        )

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        user_role=user_role,
    )


# -----------------------------------------------------------------------------
# 4. Update Workspace Name (Owner Only)
# -----------------------------------------------------------------------------
@router.patch(
    "/{slug}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update workspace details (Owner only)",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def update_workspace(
    slug: str,
    payload: WorkspaceUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update workspace metadata (e.g. rename workspace).
    
    ---------------------------------------------------------------------------
    PURPOSE:
    Called from Workspace Settings tab when an owner renames the workspace.
    
    ---------------------------------------------------------------------------
    REQUEST SPECIFICATION:
      - HTTP Method: PATCH
      - URL        : /api/v1/workspaces/{slug}
      - Headers    : Cookie: karta_session=...
      - Payload JSON Example:
        ```json
        {
          "name": "Cloud Infrastructure & Platform"
        }
        ```
        
    ---------------------------------------------------------------------------
    RESPONSE SPECIFICATION:
      - Status Code: 200 OK
      - Body JSON Example:
        ```json
        {
          "id": 1,
          "name": "Cloud Infrastructure & Platform",
          "slug": "w_k9mP2qR4",
          "owner_id": 1,
          "created_at": "2026-11-01T12:30:00Z",
          "updated_at": "2026-11-01T12:35:00Z",
          "user_role": "owner"
        }
        ```
    ---------------------------------------------------------------------------
    """
    # 1. Fetch workspace
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Check current user's role in this workspace
    member_res = await db.execute(
        select(WorkspaceMember.role).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    user_role = member_res.scalar_one_or_none()

    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only workspace owners can update workspace settings"
        )

    # 3. Apply updates
    if payload.name is not None:
        workspace.name = payload.name

    await db.commit()
    await db.refresh(workspace)

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        user_role=user_role,
    )


# -----------------------------------------------------------------------------
# 5. List Workspace Members
# -----------------------------------------------------------------------------
@router.get(
    "/{slug}/members",
    response_model=list[WorkspaceMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List all collaborators in a workspace",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def list_workspace_members(
    slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all members belonging to the specified workspace.
    """
    # 1. Fetch workspace
    res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Verify current user is a member
    mem_check = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    if not mem_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # 3. Fetch all members with joined User details
    stmt = (
        select(WorkspaceMember, User)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace.id)
        .order_by(WorkspaceMember.joined_at.asc())
    )
    rows = (await db.execute(stmt)).all()

    return [
        WorkspaceMemberResponse(
            id=membership.id,
            user_id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            role=membership.role,
            joined_at=membership.joined_at,
        )
        for membership, user in rows
    ]


# -----------------------------------------------------------------------------
# 6. Add / Invite Member to Workspace
# -----------------------------------------------------------------------------
@router.post(
    "/{slug}/members",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a collaborator to a workspace",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def add_workspace_member(
    slug: str,
    payload: AddMemberRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Invite or add a user to a workspace with a designated role ('editor' or 'viewer').
    Requires Capability.INVITE_MEMBERS (Owner permission).
    """
    # 1. Fetch workspace
    res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Check current user's role and capability
    curr_mem = await db.execute(
        select(WorkspaceMember.role).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    current_role = curr_mem.scalar_one_or_none()
    if not current_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Capability check using core permission engine
    if not PermissionChecker.is_permitted(current_role, Capability.INVITE_MEMBERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You do not have permission to invite members"
        )

    # 3. Find the target user by email
    target_user_res = await db.execute(select(User).where(User.email == payload.email))
    target_user = target_user_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{payload.email}' does not exist"
        )

    # 4. Check if target user is already a member
    existing_mem = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == target_user.id
        )
    )
    if existing_mem.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this workspace"
        )

    # 5. Add membership record
    new_member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=target_user.id,
        role=payload.role,
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return WorkspaceMemberResponse(
        id=new_member.id,
        user_id=target_user.id,
        email=target_user.email,
        name=target_user.name,
        avatar_url=target_user.avatar_url,
        role=new_member.role,
        joined_at=new_member.joined_at,
    )
