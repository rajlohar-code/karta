from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, func
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

    def __repr__(self) -> str:
        return f"<Project id={self.id} name='{self.name}' workspace_id={self.workspace_id}>"
