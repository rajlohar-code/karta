"""
Pydantic Validation & Serialization Schemas for Diagrams Domain.

Rules Adhered to:
- Strict Pydantic V2 validation (ConfigDict extra="forbid")
- from_attributes=True for SQLAlchemy ORM compatibility
- Full schema and layout snapshot representations
"""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


# -----------------------------------------------------------------------------
# 1. Base Diagram Fields
# -----------------------------------------------------------------------------
class DiagramBase(BaseModel):
    """Shared fields for all diagram requests and responses."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=128,
        description="Display name of the diagram (e.g. 'Auth & Billing Architecture')",
        examples=["Auth Database Schema"]
    )
    type: str = Field(
        default="schema",
        pattern="^(schema|flowchart)$",
        description="Type of visual diagram: 'schema' (ERD) or 'flowchart'",
        examples=["schema"]
    )
    is_public: bool = Field(
        default=False,
        description="If True, anyone with the shareable link can view in read-only mode"
    )
    is_pinned: bool = Field(
        default=False,
        description="True if pinned to favorites"
    )


# -----------------------------------------------------------------------------
# 2. Diagram Request Schemas
# -----------------------------------------------------------------------------
class DiagramCreate(DiagramBase):
    """
    Request payload to create a new diagram inside a project or as standalone.
    
    POST /api/v1/projects/{project_id}/diagrams OR /api/v1/workspaces/{slug}/diagrams
    Payload:
      {
        "name": "User Authentication ERD",
        "type": "schema",
        "is_public": false,
        "is_pinned": false
      }
    """
    project_id: int | None = Field(
        default=None,
        description="Parent project ID (None if standalone diagram)"
    )
    workspace_id: int | None = Field(
        default=None,
        description="Parent workspace ID (for standalone diagrams)"
    )


class DiagramUpdate(BaseModel):
    """
    Request payload to update diagram metadata.
    
    PATCH /api/v1/diagrams/{slug}
    Payload:
      {
        "name": "Renamed Diagram",
        "is_public": true,
        "is_pinned": true
      }
    """
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        description="Updated diagram title"
    )
    is_public: bool | None = Field(
        default=None,
        description="Updated public shareable toggle"
    )
    is_pinned: bool | None = Field(
        default=None,
        description="Toggle pinned status"
    )


# -----------------------------------------------------------------------------
# 3. Diagram Response Schemas
# -----------------------------------------------------------------------------
class DiagramSummaryResponse(DiagramBase):
    """
    Lightweight summary for listing diagrams in a project card.
    Avoids sending heavy JSONB snapshots when just browsing the list.
    """
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Internal diagram ID")
    project_id: int | None = Field(default=None, description="Parent project ID (None if standalone)")
    workspace_id: int | None = Field(default=None, description="Parent workspace ID")
    slug: str = Field(description="Unguessable URL slug for deep routing (e.g. 'd_9xK2mP1q')")
    creator_id: int | None = Field(default=None, description="Creator user ID")
    current_revision: int = Field(description="Latest revision number")
    created_at: datetime = Field(description="Creation timestamp in UTC")
    updated_at: datetime = Field(description="Last update timestamp in UTC")
    member_user_ids: list[int] = Field(
        default_factory=list,
        description="IDs of collaborators assigned to this private diagram"
    )


class DiagramDetailResponse(DiagramSummaryResponse):
    """
    Complete diagram response loaded when opening the React Flow canvas.
    Contains the full schema snapshot, node coordinates, and current user's role.
    """
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    schema_snapshot: dict[str, Any] = Field(
        default_factory=dict,
        description="Current database schema tables and relationships JSON"
    )
    layout_snapshot: dict[str, Any] = Field(
        default_factory=dict,
        description="Current node (x, y) canvas positions, sizes, and colors"
    )
    user_role: str = Field(
        default="viewer",
        description="Current user's permission level: 'owner', 'editor', 'viewer', or 'public'"
    )


# -----------------------------------------------------------------------------
# 4. Diagram Revision History & Command Execution Schemas
# -----------------------------------------------------------------------------
class DiagramRevisionResponse(BaseModel):
    """Revision timeline item for time-travel and undo/redo history."""
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Revision record ID")
    diagram_id: int = Field(description="Parent diagram ID")
    revision_no: int = Field(description="Sequential revision number (1, 2, 3...)")
    command_type: str = Field(description="Command that produced this change")
    actor_id: int | None = Field(default=None, description="User who executed the command")
    created_at: datetime = Field(description="Timestamp of revision commit")


class ExecuteCommandRequest(BaseModel):
    """
    Request payload to execute a Diagram Command (Command Pattern).
    Includes expected_revision for Optimistic Concurrency Control.
    
    POST /api/v1/diagrams/{slug}/commands
    Payload:
      {
        "command_type": "add_table",
        "expected_revision": 1,
        "command_data": {
          "table": {
            "name": "orders",
            "columns": [{"name": "id", "data_type": "serial", "is_primary_key": true}]
          },
          "initial_x": 100.0,
          "initial_y": 100.0
        }
      }
    """
    model_config = ConfigDict(extra="forbid")

    command_type: str = Field(description="Command identifier (e.g. 'add_table')")
    expected_revision: int = Field(
        description="The revision the client believes is latest (Optimistic Concurrency)"
    )
    command_data: dict[str, Any] = Field(description="Parameters for the command class")
