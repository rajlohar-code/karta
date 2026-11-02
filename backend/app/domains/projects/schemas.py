"""
Pydantic Validation & Serialization Schemas for Projects Domain.

Rules Adhered to:
- Strict Pydantic V2 validation (ConfigDict extra="forbid")
- from_attributes=True for SQLAlchemy ORM compatibility
- Full docstrings and field descriptions
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# -----------------------------------------------------------------------------
# 1. Base Project Fields
# -----------------------------------------------------------------------------
class ProjectBase(BaseModel):
    """Shared fields for all project requests and responses."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=128,
        description="Human-readable project title (e.g. 'Payment Service', 'Auth Gateway')",
        examples=["E-Commerce Platform"]
    )
    description: str | None = Field(
        default=None,
        max_length=512,
        description="Optional developer notes or description of the project",
        examples=["PostgreSQL database schemas and microservice flowcharts"]
    )
    is_public: bool = Field(
        default=False,
        description="True if public to all workspace collaborators; False if private"
    )
    is_pinned: bool = Field(
        default=False,
        description="True if pinned to quick-access favorites sidebar"
    )


# -----------------------------------------------------------------------------
# 2. Project Request Schemas
# -----------------------------------------------------------------------------
class ProjectCreate(ProjectBase):
    """
    Request payload to create a new project inside a workspace.
    
    POST /api/v1/workspaces/{slug}/projects
    Payload:
      {
        "name": "Payments Microservice",
        "description": "Schemas and flowcharts for Razorpay integration",
        "is_pinned": false
      }
    """
    pass


class ProjectUpdate(BaseModel):
    """
    Request payload to update an existing project's metadata.
    
    PATCH /api/v1/workspaces/{slug}/projects/{project_id}
    Payload:
      {
        "name": "Updated Project Name",
        "description": "Updated description",
        "is_pinned": true
      }
    """
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        description="Updated project title"
    )
    description: str | None = Field(
        default=None,
        max_length=512,
        description="Updated project description"
    )
    is_public: bool | None = Field(
        default=None,
        description="Toggle public/private status"
    )
    is_pinned: bool | None = Field(
        default=None,
        description="Toggle pinned status"
    )


class UpdateResourceMembersRequest(BaseModel):
    """
    Request payload to explicitly assign collaborators to a private project or diagram.
    
    PUT /api/v1/projects/{project_id}/members
    Payload:
      {
        "member_user_ids": [1, 2, 5]
      }
    """
    model_config = ConfigDict(extra="forbid")

    member_user_ids: list[int] = Field(
        default_factory=list,
        description="List of user IDs granted access to this private resource"
    )


# -----------------------------------------------------------------------------
# 3. Project Response Schema
# -----------------------------------------------------------------------------
class ProjectResponse(ProjectBase):
    """
    Public project object returned to the React frontend.
    
    Includes diagrams_count so frontend project cards can display:
    "📁 Payment Gateway (4 Diagrams)"
    """
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Unique internal project ID")
    workspace_id: int = Field(description="Parent workspace ID")
    created_at: datetime = Field(description="Creation timestamp in UTC")
    updated_at: datetime = Field(description="Last update timestamp in UTC")
    diagrams_count: int = Field(default=0, description="Number of diagrams inside this project")
    member_user_ids: list[int] = Field(
        default_factory=list,
        description="List of user IDs granted access to this private project"
    )
