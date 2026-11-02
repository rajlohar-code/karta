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
# 4. PBAC Granular Capability Permissions Schema (13 Boolean Flags)
# Grounded in: frontend/src/types/workspace.ts & karta_security.md (Layer 2)
# -----------------------------------------------------------------------------
class WorkspacePermissionsSchema(BaseModel):
    """
    Fine-Grained Capability-Based Permissions Matrix (PBAC).
    Replaces static roles with 13 boolean flags.
    Strictly validated with extra="forbid" to prevent unauthorized attribute injection.
    """
    model_config = ConfigDict(extra="forbid")

    can_view_public_diagrams: bool = Field(
        default=True,
        description="Can inspect and view all public diagrams in workspace"
    )
    can_create_schemas: bool = Field(
        default=False,
        description="Can create new relational database schema canvases"
    )
    can_create_flowcharts: bool = Field(
        default=False,
        description="Can create system architecture and logic flowcharts"
    )
    can_create_public_diagrams: bool = Field(
        default=False,
        description="Can publish diagrams as visible to everyone in workspace"
    )
    can_edit_public_schemas: bool = Field(
        default=False,
        description="Can modify tables, columns, and foreign keys on public schemas"
    )
    can_edit_private_diagrams_if_added: bool = Field(
        default=False,
        description="Can edit private diagrams only when explicitly assigned as collaborator"
    )
    can_create_public_projects: bool = Field(
        default=False,
        description="Can create public project folders accessible to all collaborators"
    )
    can_create_private_projects: bool = Field(
        default=False,
        description="Can create restricted private project folders"
    )
    can_add_members_to_private_projects_if_added: bool = Field(
        default=False,
        description="Can add/remove other collaborators inside private projects they belong to"
    )
    can_use_readonly_ai: bool = Field(
        default=False,
        description="Can ask AI questions about architecture without mutating diagrams"
    )
    can_use_ai_generation: bool = Field(
        default=False,
        description="Can use AI Copilot to generate and auto-apply schema modifications"
    )
    can_view_permissions: bool = Field(
        default=False,
        description="Can inspect capability configurations and collaborator access levels"
    )
    can_edit_permissions: bool = Field(
        default=False,
        description="Can update permissions and capability settings for workspace collaborators"
    )


# -----------------------------------------------------------------------------
# 5. Workspace Membership Schemas (Team Collaboration)
# -----------------------------------------------------------------------------
class WorkspaceMemberResponse(BaseModel):
    """Information about a collaborator inside a workspace."""
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Membership record ID")
    user_id: int = Field(description="Member user ID")
    email: EmailStr = Field(description="Member email address")
    name: str = Field(description="Member display name")
    avatar_url: str | None = Field(default=None, description="Member avatar URL")
    role: str = Field(default="member", description="Assigned role: 'owner', 'member', etc.")
    is_owner: bool = Field(default=False, description="True if this user is the primary workspace owner/creator")
    permissions: WorkspacePermissionsSchema = Field(
        default_factory=WorkspacePermissionsSchema,
        description="Fine-grained PBAC capability flags"
    )
    joined_at: datetime = Field(description="Timestamp when member joined")


class UpdateMemberPermissionsRequest(BaseModel):
    """
    Request payload to update the 13 fine-grained capability flags for a collaborator.
    
    PATCH /api/v1/workspaces/{slug}/members/{user_id}/permissions
    Payload:
      {
        "permissions": {
          "can_view_public_diagrams": true,
          "can_create_schemas": true,
          ...
        }
      }
    """
    model_config = ConfigDict(extra="forbid")

    permissions: WorkspacePermissionsSchema = Field(
        description="Updated 13 boolean capability flags"
    )


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
        pattern="^(owner|editor|viewer|member)$",
        description="Role: 'owner', 'editor', 'viewer', or 'member'"
    )
    permissions: WorkspacePermissionsSchema | None = Field(
        default=None,
        description="Optional initial capability permissions to grant"
    )


# -----------------------------------------------------------------------------
# 6. Token-based Production Invitation Schemas
# -----------------------------------------------------------------------------
class CreateInvitationRequest(BaseModel):
    """
    Request payload to send an email invitation with an unguessable token link.
    
    POST /api/v1/workspaces/{slug}/invitations
    Payload:
      {
        "email": "future.teammate@company.com",
        "role": "editor",
        "permissions": { ... }
      }
    """
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(description="Email of person to invite")
    role: str = Field(
        default="editor",
        pattern="^(editor|viewer|member)$",
        description="Role to grant: 'editor', 'viewer', or 'member'"
    )
    permissions: WorkspacePermissionsSchema | None = Field(
        default=None,
        description="Fine-grained PBAC permissions to assign upon acceptance"
    )


class WorkspaceInvitationResponse(BaseModel):
    """Details of an issued or pending workspace invitation."""
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Unique invitation ID")
    workspace_id: int = Field(description="Target workspace ID")
    email: EmailStr = Field(description="Invited user email")
    role: str = Field(description="Role: 'editor' or 'viewer'")
    status: str = Field(description="Status: 'pending', 'accepted', 'revoked', 'expired'")
    expires_at: datetime = Field(description="Expiration timestamp in UTC")
    created_at: datetime = Field(description="Issued timestamp in UTC")
    invite_link: str = Field(description="Complete acceptance URL link")


class AcceptInvitationResponse(BaseModel):
    """Response returned when an invite token is accepted."""
    model_config = ConfigDict(extra="forbid")

    message: str = Field(default="Invitation accepted successfully", description="Status message")
    workspace_slug: str = Field(description="Slug of the workspace joined")
    workspace_name: str = Field(description="Name of the workspace joined")
    role: str = Field(description="Assigned role in workspace")
