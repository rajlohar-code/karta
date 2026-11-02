"""
RESTful API Router for Workspaces Domain.

Adheres to:
- Rule 10 RESTful standards (Nouns only: /api/v1/workspaces, HTTP verbs determine action)
- Unguessable random slugs (/w/{slug}) per karta_security.md Layer 3
- Deny-first capability checks (PermissionChecker & Capability registry)
- Mandatory @log_endpoint decorator on every single route
- Full docstrings with request and response JSON examples
"""
from datetime import datetime, timedelta, timezone
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.capabilities import Capability
from app.core.permissions import PermissionChecker
from app.dependencies import get_current_user
from app.domains.users.models import User
from app.domains.workspaces.models import (
    DEFAULT_MEMBER_PERMISSIONS,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMember,
)
from app.domains.workspaces.schemas import (
    AcceptInvitationResponse,
    AddMemberRequest,
    CreateInvitationRequest,
    UpdateMemberPermissionsRequest,
    WorkspaceCreate,
    WorkspaceInvitationResponse,
    WorkspaceMemberResponse,
    WorkspacePermissionsSchema,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.infra.database import get_db
from app.services.email_service import EmailProvider, get_email_service
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


def _generate_invitation_token() -> str:
    """
    Generate a cryptographically secure, unguessable URL token for invitations.
    Example output: 'inv_8xK9mP2qR4tY7zL1w3'
    """
    token_str = secrets.token_urlsafe(24).replace("-", "").replace("_", "")
    return f"inv_{token_str[:32]}"


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
            is_owner=(user.id == workspace.owner_id),
            permissions=WorkspacePermissionsSchema(**(membership.permissions or DEFAULT_MEMBER_PERMISSIONS)),
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
    Invite or add a user to a workspace with designated capabilities.
    Requires Capability.INVITE_MEMBERS (Owner/Admin permission).
    """
    # 1. Fetch workspace
    res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Check current user's role and capability
    curr_mem = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    actor_mem = curr_mem.scalar_one_or_none()
    if not actor_mem:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Capability check using core permission engine
    if not PermissionChecker.is_permitted(
        role=actor_mem.role,
        capability=Capability.EDIT_PERMISSIONS,
        custom_grants=actor_mem.permissions,
        user_id=current_user.id,
        workspace_owner_id=workspace.owner_id,
    ):
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
    initial_perms = (
        payload.permissions.model_dump()
        if payload.permissions
        else dict(DEFAULT_MEMBER_PERMISSIONS)
    )
    new_member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=target_user.id,
        role=payload.role,
        permissions=initial_perms,
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
        is_owner=(target_user.id == workspace.owner_id),
        permissions=WorkspacePermissionsSchema(**new_member.permissions),
        joined_at=new_member.joined_at,
    )


# -----------------------------------------------------------------------------
# 7. Update Collaborator Permissions (PBAC)
# -----------------------------------------------------------------------------
@router.patch(
    "/{slug}/members/{user_id}/permissions",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Update fine-grained capability permissions of a collaborator",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def update_member_permissions(
    slug: str,
    user_id: int,
    payload: UpdateMemberPermissionsRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the 13 boolean capability flags for a specific collaborator.
    
    ---------------------------------------------------------------------------
    SECURITY GUARDS:
    - Actor must be workspace owner OR hold 'can_edit_permissions'.
    - Target user CANNOT be the primary workspace owner (creator permissions are immutable).
    ---------------------------------------------------------------------------
    """
    # 1. Fetch workspace
    res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Check actor's authorization
    curr_mem = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    actor_mem = curr_mem.scalar_one_or_none()
    if not actor_mem:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    can_edit = PermissionChecker.is_permitted(
        role=actor_mem.role,
        capability=Capability.EDIT_PERMISSIONS,
        custom_grants=actor_mem.permissions,
        user_id=current_user.id,
        workspace_owner_id=workspace.owner_id,
    )
    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You do not have permission to edit collaborator permissions"
        )

    # 3. Guard: Cannot modify the primary owner's permissions!
    if user_id == workspace.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify permissions of the workspace creator"
        )

    # 4. Find target membership record
    target_mem_res = await db.execute(
        select(WorkspaceMember, User)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user_id
        )
    )
    target_row = target_mem_res.first()
    if not target_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found in this workspace"
        )
    target_membership, target_user = target_row

    # 5. Apply updated permissions
    target_membership.permissions = payload.permissions.model_dump()
    await db.commit()
    await db.refresh(target_membership)

    return WorkspaceMemberResponse(
        id=target_membership.id,
        user_id=target_user.id,
        email=target_user.email,
        name=target_user.name,
        avatar_url=target_user.avatar_url,
        role=target_membership.role,
        is_owner=False,
        permissions=WorkspacePermissionsSchema(**target_membership.permissions),
        joined_at=target_membership.joined_at,
    )


# -----------------------------------------------------------------------------
# 8. Remove Collaborator from Workspace
# -----------------------------------------------------------------------------
@router.delete(
    "/{slug}/members/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a collaborator from a workspace",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def remove_workspace_member(
    slug: str,
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a collaborator from this workspace.
    
    ---------------------------------------------------------------------------
    SECURITY GUARDS:
    - Primary Owner CANNOT be removed by anyone (including themselves).
    - Actor must be workspace owner OR hold 'can_edit_permissions'.
    ---------------------------------------------------------------------------
    """
    # 1. Fetch workspace
    res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Guard: Primary Owner CANNOT be removed!
    if user_id == workspace.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The workspace creator cannot be removed from the workspace"
        )

    # 3. Check actor's authorization
    curr_mem = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    actor_mem = curr_mem.scalar_one_or_none()
    if not actor_mem:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    is_self = (current_user.id == user_id)
    is_admin = PermissionChecker.is_permitted(
        role=actor_mem.role,
        capability=Capability.EDIT_PERMISSIONS,
        custom_grants=actor_mem.permissions,
        user_id=current_user.id,
        workspace_owner_id=workspace.owner_id,
    )

    if not is_self and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You do not have permission to remove collaborators"
        )

    # 4. Fetch target membership
    target_mem = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user_id
        )
    )
    membership_to_delete = target_mem.scalar_one_or_none()
    if not membership_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found in this workspace"
        )

    # 5. Delete membership
    await db.delete(membership_to_delete)
    await db.commit()

    return {"message": "Collaborator removed successfully", "user_id": user_id}


# -----------------------------------------------------------------------------
# 7. Create & Send Email Invitation (Production Token Flow)
# -----------------------------------------------------------------------------
@router.post(
    "/{slug}/invitations",
    response_model=WorkspaceInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send an email invitation with an unguessable token link",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def create_workspace_invitation(
    slug: str,
    payload: CreateInvitationRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    email_service: EmailProvider = Depends(get_email_service),
):
    """
    Issue an unguessable, 7-day token-based invitation and send an email to the recipient.
    
    ---------------------------------------------------------------------------
    SECURITY ARCHITECTURE:
    - Capability: Requires Capability.INVITE_MEMBERS (Owner permission).
    - Prevents duplicate invitations: Re-uses/refreshes any existing pending invitation.
    - Unguessable token: 32 cryptographically random URL-safe characters.
    - Expiration window: 7 days strictly enforced.
    - Pluggable Email: Dispatches notification via EmailProvider.
    ---------------------------------------------------------------------------
    """
    # 1. Fetch workspace
    ws_res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = ws_res.scalar_one_or_none()
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
    if not PermissionChecker.is_permitted(current_role, Capability.INVITE_MEMBERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only workspace owners can invite new members"
        )

    # 3. Check if recipient is already an active member of this workspace
    user_check = await db.execute(select(User).where(User.email == payload.email))
    existing_user = user_check.scalar_one_or_none()
    if existing_user:
        active_mem = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace.id,
                WorkspaceMember.user_id == existing_user.id
            )
        )
        if active_mem.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{payload.email}' is already an active member of this workspace"
            )

    # 4. Generate unguessable token and 7-day expiration
    token = _generate_invitation_token()
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(days=7)

    # 5. Check if there's an existing pending invite for this email; if so, revoke it
    existing_inv_res = await db.execute(
        select(WorkspaceInvitation).where(
            WorkspaceInvitation.workspace_id == workspace.id,
            WorkspaceInvitation.email == payload.email,
            WorkspaceInvitation.status == "pending"
        )
    )
    existing_inv = existing_inv_res.scalar_one_or_none()
    if existing_inv:
        existing_inv.status = "revoked"

    # 6. Insert new WorkspaceInvitation
    invitation = WorkspaceInvitation(
        workspace_id=workspace.id,
        email=payload.email,
        role=payload.role,
        token=token,
        invited_by_id=current_user.id,
        status="pending",
        expires_at=expires_at,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # 7. Dispatch Email through pluggable EmailService
    await email_service.send_invitation_email(
        recipient_email=payload.email,
        workspace_name=workspace.name,
        inviter_name=current_user.name,
        role=payload.role,
        invite_token=token,
    )

    invite_url = f"{settings.FRONTEND_URL}/invite/{token}"
    return WorkspaceInvitationResponse(
        id=invitation.id,
        workspace_id=invitation.workspace_id,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        invite_link=invite_url,
    )


# -----------------------------------------------------------------------------
# 8. List Pending Invitations (Owner Only)
# -----------------------------------------------------------------------------
@router.get(
    "/{slug}/invitations",
    response_model=list[WorkspaceInvitationResponse],
    status_code=status.HTTP_200_OK,
    summary="List all pending invitations for a workspace",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def list_pending_invitations(
    slug: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending invitations awaiting acceptance."""
    # 1. Fetch workspace
    ws_res = await db.execute(select(Workspace).where(Workspace.slug == slug))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # 2. Check owner permission
    curr_mem = await db.execute(
        select(WorkspaceMember.role).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    current_role = curr_mem.scalar_one_or_none()
    if not PermissionChecker.is_permitted(current_role, Capability.INVITE_MEMBERS):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # 3. Query pending invitations
    invs_res = await db.execute(
        select(WorkspaceInvitation)
        .where(
            WorkspaceInvitation.workspace_id == workspace.id,
            WorkspaceInvitation.status == "pending"
        )
        .order_by(WorkspaceInvitation.created_at.desc())
    )
    invitations = invs_res.scalars().all()

    return [
        WorkspaceInvitationResponse(
            id=inv.id,
            workspace_id=inv.workspace_id,
            email=inv.email,
            role=inv.role,
            status=inv.status,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
            invite_link=f"{settings.FRONTEND_URL}/invite/{inv.token}",
        )
        for inv in invitations
    ]


# -----------------------------------------------------------------------------
# 9. Accept Workspace Invitation by Token
# -----------------------------------------------------------------------------
@router.post(
    "/invitations/{token}/accept",
    response_model=AcceptInvitationResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept an invitation token and join the workspace",
)
@log_endpoint(folder_name="workspaces", file_name="workspaces.log")
async def accept_workspace_invitation(
    token: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept an invitation token and add the authenticated user to the workspace.
    
    ---------------------------------------------------------------------------
    SECURITY CHECKS:
    1. Validates token existence and authenticity.
    2. Validates invitation is in 'pending' status.
    3. Validates expiration: rejects expired tokens (> 7 days).
    4. Automatically adds membership with the exact invited role ('editor'/'viewer').
    5. Marks invitation status as 'accepted' to prevent replay attacks.
    ---------------------------------------------------------------------------
    """
    # 1. Fetch invitation by token
    inv_res = await db.execute(select(WorkspaceInvitation).where(WorkspaceInvitation.token == token))
    invitation = inv_res.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or invalid token"
        )

    # 2. Check status
    if invitation.status == "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been accepted"
        )
    if invitation.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has been revoked by the workspace owner"
        )

    # 3. Check expiration
    now_utc = datetime.now(timezone.utc)
    if now_utc > invitation.expires_at:
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has expired. Please ask the owner for a new invitation."
        )

    # 4. Fetch the target workspace
    ws_res = await db.execute(select(Workspace).where(Workspace.id == invitation.workspace_id))
    workspace = ws_res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace no longer exists")

    # 5. Check if already a member
    mem_check = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    existing_mem = mem_check.scalar_one_or_none()

    if not existing_mem:
        # Add to workspace members
        new_membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=current_user.id,
            role=invitation.role,
        )
        db.add(new_membership)

    # 6. Mark invitation accepted
    invitation.status = "accepted"
    await db.commit()

    return AcceptInvitationResponse(
        message="Invitation accepted successfully",
        workspace_slug=workspace.slug,
        workspace_name=workspace.name,
        role=invitation.role,
    )
