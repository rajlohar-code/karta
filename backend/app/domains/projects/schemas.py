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
        "description": "Schemas and flowcharts for Razorpay integration"
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
        "description": "Updated description"
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
