"""
Pydantic Validation & Serialization Schemas for Workspaces Domain.

Rules Adhered to:
- Strict Pydantic V2 validation (ConfigDict extra="forbid")
- from_attributes=True for seamless SQLAlchemy ORM model compatibility
- RESTful payload and response definitions
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# -----------------------------------------------------------------------------
# 1. Base Workspace Fields
# -----------------------------------------------------------------------------
class WorkspaceBase(BaseModel):
    """Shared workspace fields."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=128,
        description="Human-readable workspace title (e.g. 'Personal', 'Engineering')",
        examples=["My Engineering Team"]
    )


# -----------------------------------------------------------------------------
# 2. Workspace Request Schemas (Incoming Data from Frontend)
# -----------------------------------------------------------------------------
class WorkspaceCreate(WorkspaceBase):
    """
    Request payload when creating a new workspace.
    
    POST /api/v1/workspaces
    Payload:
      {
        "name": "Backend Architecture"
      }
    """
    pass


class WorkspaceUpdate(BaseModel):
    """
    Request payload when updating an existing workspace.
    
    PATCH /api/v1/workspaces/{slug}
    Payload:
      {
        "name": "Renamed Workspace"
      }
    """
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        description="Updated workspace name",
        examples=["Cloud Infrastructure"]
    )


# -----------------------------------------------------------------------------
# 3. Workspace Response Schemas (Outgoing Data to Frontend)
# -----------------------------------------------------------------------------
class WorkspaceResponse(WorkspaceBase):
    """
    Public workspace object returned to frontend client.
    
    Why include 'user_role'?
    The UI needs to know if the logged-in user is 'owner', 'editor', or 'viewer'
    in this workspace to disable/enable UI buttons (e.g., Delete button).
    """
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Internal database ID")
    slug: str = Field(description="Unguessable random URL slug (e.g. 'w_9xK2mP1q')")
    owner_id: int = Field(description="ID of the workspace owner")
    created_at: datetime = Field(description="Creation timestamp in UTC")
    updated_at: datetime = Field(description="Last update timestamp in UTC")
    user_role: str = Field(
        default="viewer",
        description="Role of the currently logged-in user in this workspace ('owner', 'editor', 'viewer')"
    )


# -----------------------------------------------------------------------------
# 4. Workspace Membership Schemas (Team Collaboration)
# -----------------------------------------------------------------------------
class WorkspaceMemberResponse(BaseModel):
    """Information about a collaborator inside a workspace."""
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Membership record ID")
    user_id: int = Field(description="Member user ID")
    email: EmailStr = Field(description="Member email address")
    name: str = Field(description="Member display name")
    avatar_url: str | None = Field(default=None, description="Member avatar URL")
    role: str = Field(description="Assigned role: 'owner', 'editor', 'viewer'")
    joined_at: datetime = Field(description="Timestamp when member joined")


class AddMemberRequest(BaseModel):
    """
    Request payload to invite/add a member to a workspace.
    
    POST /api/v1/workspaces/{slug}/members
    Payload:
      {
        "email": "colleague@company.com",
        "role": "editor"
      }
    """
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(description="Email of user to add")
    role: str = Field(
        default="editor",
        pattern="^(owner|editor|viewer)$",
        description="Role: 'owner', 'editor', or 'viewer'"
    )
