from datetime import datetime
from typing import Any
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infra.database import Base


class Diagram(Base):
    """
    SQLAlchemy ORM Model representing a Diagram (Database Schema or Flowchart).
    
    ---------------------------------------------------------------------------
    WHAT IS A DIAGRAM? (SRS Section 4 & 5)
    A Diagram is the primary visual document created by users.
    Types:
      - 'schema'    : Relational database schema with tables, columns, FKs.
      - 'flowchart' : Flowchart with process nodes, decision diamonds, and directed edges.
    
    Security:
      - Uses unguessable random slug (`/d/xK9mP2qR`) for shareable deep routing.
    ---------------------------------------------------------------------------
    """
    __tablename__ = "diagrams"

    # Primary Key (internal B-tree integer ID)
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Internal diagram ID",
    )

    # Parent Project ID (Nullable for standalone diagrams outside projects)
    project_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        default=None,
        doc="ID of the parent project (if inside a project folder)",
    )

    # Parent Workspace ID (Direct link for standalone diagrams)
    workspace_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        default=None,
        doc="ID of the workspace (especially for standalone diagrams)",
    )

    # Diagram Name (e.g. 'Auth & Billing Architecture')
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Display name of the diagram",
    )

    # Diagram Type: 'schema' or 'flowchart'
    type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="schema",
        doc="Diagram type: 'schema' or 'flowchart'",
    )

    # Unguessable URL Slug (karta_security.md: /d/xK9mP2qR)
    # NEVER guessable numbers like /d/1. Prevents unauthorized ID scanning!
    slug: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        doc="Unguessable random URL slug for shareable links",
    )

    # Creator: The user who drafted the diagram
    creator_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="ID of the user who created this diagram",
    )

    # Public sharing mode: If True, anyone with the link can view in read-only
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="True if publicly viewable via share link",
    )

    # Pinned status for quick-access favorites
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        doc="True if pinned to quick-access favorites",
    )

    # Current accepted revision number (monotonically increasing: 1, 2, 3...)
    current_revision: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Latest accepted revision number",
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when diagram was created",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        doc="Timestamp when diagram was last edited",
    )

    # Relationships
    project: Mapped["Project | None"] = relationship(
        "Project",
        doc="Parent project object (None if standalone diagram)",
    )

    members: Mapped[list["DiagramMember"]] = relationship(
        "DiagramMember",
        back_populates="diagram",
        cascade="all, delete-orphan",
        doc="Explicit collaborators granted access to this private diagram",
    )

    revisions: Mapped[list["DiagramRevision"]] = relationship(
        "DiagramRevision",
        back_populates="diagram",
        cascade="all, delete-orphan",
        order_by="DiagramRevision.revision_no",
        doc="Full revision history timeline",
    )

    def __repr__(self) -> str:
        return f"<Diagram id={self.id} name='{self.name}' type='{self.type}' slug='{self.slug}'>"


class DiagramMember(Base):
    """
    SQLAlchemy ORM Model representing explicit collaborator assignment to a Private Diagram.
    
    ---------------------------------------------------------------------------
    PBAC PRIVATE DIAGRAM ISOLATION:
    - If a diagram is private (`is_public = False`) and outside a project:
      Only Workspace Owner or users in this table can view/edit it.
    ---------------------------------------------------------------------------
    """
    __tablename__ = "diagram_members"

    __table_args__ = (
        UniqueConstraint("diagram_id", "user_id", name="uq_diagram_user_member"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Internal diagram membership ID",
    )

    diagram_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("diagrams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the private diagram",
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the assigned collaborator user",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when collaborator was added to this private diagram",
    )

    # Relationship back to Diagram
    diagram: Mapped["Diagram"] = relationship(
        "Diagram",
        back_populates="members",
    )

    def __repr__(self) -> str:
        return f"<DiagramMember diagram_id={self.diagram_id} user_id={self.user_id}>"


class DiagramRevision(Base):
    """
    SQLAlchemy ORM Model representing an immutable historical revision of a diagram.
    
    ---------------------------------------------------------------------------
    WHAT IS A DIAGRAM REVISION? (SRS Section 13 & LLD Section 7)
    Every single accepted edit (add table, move node, change color, AI apply):
      1. Has an actor (who did it).
      2. Has a monotonic revision number (rev 1 -> rev 2 -> rev 3).
      3. Saves the full command that caused the change.
      4. Stores full JSONB snapshots of the schema and layout+styles.
      
    Why is this revolutionary?
      - 100% Deterministic Undo / Redo.
      - Time-travel: users can inspect and restore any past state.
      - Live collaboration: detects conflicts if someone tries to edit an old revision!
    ---------------------------------------------------------------------------
    """
    __tablename__ = "diagram_revisions"

    # Primary Key
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Revision record ID",
    )

    # Parent Diagram ID
    diagram_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("diagrams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the diagram",
    )

    # Monotonically increasing revision number (1, 2, 3...)
    revision_no: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
        doc="Sequential revision number for this diagram",
    )

    # Command Type (e.g. 'add_table', 'rename_column', 'update_style', 'move_node')
    command_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Name of the Command pattern class executed",
    )

    # Full Command Payload JSON (exact inputs passed to the command)
    command_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        doc="Full parameters of the executed command in JSONB",
    )

    # Full Schema Snapshot (tables, columns, types, foreign keys at this revision)
    schema_snapshot: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        doc="Complete structured schema definition JSONB",
    )

    # Full Layout & Style Snapshot (x, y coordinates, sizes, per-object color styles)
    layout_snapshot: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        doc="Node positions and custom style color overrides JSONB",
    )

    # Actor: The user who performed this revision (or None if system/migration)
    actor_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who made this change",
    )

    # Timestamp of the revision
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when this revision was committed",
    )

    # Relationship back to parent diagram
    diagram: Mapped["Diagram"] = relationship(
        "Diagram",
        back_populates="revisions",
    )

    def __repr__(self) -> str:
        return f"<DiagramRevision diagram_id={self.diagram_id} rev={self.revision_no} cmd='{self.command_type}'>"
