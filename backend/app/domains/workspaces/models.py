from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infra.database import Base


class Workspace(Base):
    """
    SQLAlchemy ORM Model representing a Workspace.
    
    ---------------------------------------------------------------------------
    WHAT IS A WORKSPACE? (SRS Section 4)
    A workspace is the primary access and collaboration boundary.
    - Every user gets a 'Personal' workspace upon registration.
    - Users can also create or join shared team workspaces.
    - A workspace contains Projects, which in turn contain Diagrams.
    ---------------------------------------------------------------------------
    """
    __tablename__ = "workspaces"

    # Primary Key
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Internal workspace ID",
    )

    # Workspace Name (e.g. 'Personal', 'Acme Engineering Team')
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Human-readable name of the workspace",
    )

    # Unguessable Random URL Slug (karta_security.md Layer 3)
    # Why? We never expose integer IDs in URLs like /w/1.
    # Instead, we use /w/xK9mP2qR to prevent unauthorized ID enumeration.
    slug: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        doc="Unguessable random URL slug for shareable links",
    )

    # Owner: The user who created this workspace and has full admin control
    # ForeignKey ensures this ID must exist in the 'users' table!
    owner_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the user who owns this workspace",
    )

    # Timestamps (Timezone-aware)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when workspace was created",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        doc="Timestamp when workspace details were last updated",
    )

    # Relationships (Allows user to access: workspace.members)
    members: Mapped[list["WorkspaceMember"]] = relationship(
        "WorkspaceMember",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Workspace id={self.id} name='{self.name}' slug='{self.slug}'>"


class WorkspaceMember(Base):
    """
    SQLAlchemy ORM Model representing membership of a user in a workspace.
    
    ---------------------------------------------------------------------------
    WHAT IS THIS TABLE?
    This is an associative / junction table that maps Users to Workspaces.
    It tracks:
      - Who belongs to which workspace.
      - What role they hold inside that specific workspace ('owner', 'editor', 'viewer').
    ---------------------------------------------------------------------------
    """
    __tablename__ = "workspace_members"

    # Unique constraint ensures a user cannot be added twice to the same workspace!
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_user_membership"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Membership record ID",
    )

    workspace_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the workspace",
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the member user",
    )

    # Role inside this workspace: 'owner', 'editor', 'viewer'
    role: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="viewer",
        doc="Workspace-scoped role ('owner', 'editor', 'viewer')",
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when member joined the workspace",
    )

    # Relationship back to the parent Workspace
    workspace: Mapped["Workspace"] = relationship(
        "Workspace",
        back_populates="members",
    )

    def __repr__(self) -> str:
        return f"<WorkspaceMember workspace_id={self.workspace_id} user_id={self.user_id} role='{self.role}'>"


class WorkspaceInvitation(Base):
    """
    SQLAlchemy ORM Model representing an unguessable token-based Workspace Invitation.
    
    ---------------------------------------------------------------------------
    PRODUCTION INVITATION SYSTEM:
    When an owner invites a collaborator via email:
    1. A cryptographically unguessable token (e.g. 'inv_7xK9mP2q...') is generated.
    2. An expiration window is set (default: 7 days).
    3. Status is tracked: 'pending' -> 'accepted' | 'revoked' | 'expired'.
    4. An email notification is sent with the clickable acceptance link.
    5. Works seamlessly whether the invitee already has an account or signs up later!
    ---------------------------------------------------------------------------
    """
    __tablename__ = "workspace_invitations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Internal invitation record ID",
    )

    workspace_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Target workspace ID",
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        doc="Email address of the invited collaborator",
    )

    role: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="editor",
        doc="Assigned role: 'editor' or 'viewer'",
    )

    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        doc="Cryptographic unguessable URL token for accepting the invite",
    )

    invited_by_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        doc="User ID of the member who sent this invitation",
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        doc="Invitation status: 'pending', 'accepted', 'revoked', 'expired'",
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Timestamp when this invitation expires (UTC)",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when invitation was issued",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        doc="Timestamp when status was last updated",
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace")

    def __repr__(self) -> str:
        return f"<WorkspaceInvitation email='{self.email}' role='{self.role}' status='{self.status}'>"
