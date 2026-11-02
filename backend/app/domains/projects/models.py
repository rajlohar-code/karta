from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infra.database import Base


class Project(Base):
    """
    SQLAlchemy ORM Model representing a Project.
    
    ---------------------------------------------------------------------------
    WHAT IS A PROJECT? (SRS Section 4)
    A Project is a named collection of related database schemas and flowcharts.
    Hierarchy:
      Workspace (Company / Team)
        └── Project (e.g. 'E-Commerce Platform', 'Billing Service')
              └── Diagrams (Schema tables, Architecture flows)
    ---------------------------------------------------------------------------
    """
    __tablename__ = "projects"

    # Primary Key
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Internal project ID",
    )

    # Parent Workspace ID
    # ForeignKey with CASCADE: If workspace is deleted, its projects are cleaned up!
    workspace_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the parent workspace this project belongs to",
    )

    # Project Name (e.g. 'Payment Gateway Redesign')
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Human-readable project name",
    )

    # Optional description / notes
    description: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        default=None,
        doc="Optional brief summary of the project",
    )

    # Public vs Private Project (by default private per PBAC requirements)
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        doc="True if public to all workspace collaborators; False if private",
    )

    # Pinned status for quick sidebar access
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        doc="True if pinned to quick-access favorites",
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when project was created",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        doc="Timestamp when project was last updated",
    )

    # Relationship to parent Workspace
    workspace: Mapped["Workspace"] = relationship(
        "Workspace",
        doc="Parent workspace object",
    )

    # Explicit collaborators assigned to this private project
    members: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
        doc="Explicit collaborators granted access to this private project",
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} name='{self.name}' workspace_id={self.workspace_id} is_public={self.is_public}>"


class ProjectMember(Base):
    """
    SQLAlchemy ORM Model representing explicit collaborator assignment to a Private Project.
    
    ---------------------------------------------------------------------------
    PBAC PRIVATE PROJECT ISOLATION:
    - If a project is private (`is_public = False`), only:
        1. Workspace Owner / Admins
        2. Collaborators explicitly added in this `project_members` table
      can view, inspect, or manage items inside this project.
    ---------------------------------------------------------------------------
    """
    __tablename__ = "project_members"

    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_user_member"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Internal project membership ID",
    )

    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the private project",
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
        doc="Timestamp when collaborator was added to this private project",
    )

    # Relationship back to Project
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="members",
    )

    def __repr__(self) -> str:
        return f"<ProjectMember project_id={self.project_id} user_id={self.user_id}>"

