from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.infra.database import Base


class User(Base):
    """
    SQLAlchemy ORM Model representing an authenticated user account.
    
    ---------------------------------------------------------------------------
    WHAT IS THIS TABLE?
    The `users` table stores user identity, profile details from Google OAuth,
    and administrative privilege status.
    
    ---------------------------------------------------------------------------
    SQLAlchemy 2.0 Modern Syntax:
    Instead of the old `id = Column(Integer, ...)` syntax, we use `Mapped[int]`.
    Why? `Mapped[int]` gives 100% type-hinting support in Python, so your IDE
    (and mypy/Pydantic) knows the exact type of every column at write-time!
    ---------------------------------------------------------------------------
    """
    __tablename__ = "users"

    # Primary Key: Integer autoincrement ID for fast internal B-tree indexing
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Unique internal user ID",
    )

    # Email: Received from Google OAuth. Must be unique and indexed for fast login lookups
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="User email address from Google OAuth (unique)",
    )

    # Full Name: Display name shown on collaborative cursors and comment cards
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Full display name (e.g. 'Raj Lohar')",
    )

    # Avatar URL: Profile picture from Google OAuth (optional, nullable)
    avatar_url: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        default=None,
        doc="URL to avatar image hosted by Google",
    )

    # Platform Role: 'user' (default) or 'admin' (grants access to /admin panel)
    role: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="user",
        doc="Global platform role: 'user' or 'admin'",
    )

    # Soft Suspension Flag: If admin bans a user, we set is_active=False.
    # We DO NOT delete the row so diagram foreign keys and history remain intact.
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        doc="True if account is active, False if suspended by admin",
    )

    # Timestamps (Timezone-aware TIMESTAMPTZ)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when user was created in UTC",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        doc="Timestamp when user profile was last updated in UTC",
    )

    def __repr__(self) -> str:
        """Friendly developer string representation for debugging."""
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"
