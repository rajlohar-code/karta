from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user fields shared across requests and responses."""
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(description="User email address")
    name: str = Field(min_length=1, max_length=128, description="User full display name")
    avatar_url: str | None = Field(default=None, max_length=512, description="Google profile picture URL")


class UserResponse(UserBase):
    """
    Public User Profile Response Schema.
    
    Why from_attributes=True?
    In Pydantic v2, this allows reading directly from SQLAlchemy ORM models
    without needing manual dict conversions!
    """
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int = Field(description="Unique internal user ID")
    role: str = Field(description="Platform role ('user' or 'admin')")
    is_active: bool = Field(description="Account active status")
    created_at: datetime = Field(description="Account creation timestamp in UTC")


class DevLoginRequest(BaseModel):
    """Request payload for local development mock authentication."""
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(default="dev@karta.app", description="Dev email to authenticate as")
    name: str = Field(default="Dev User", min_length=1, max_length=128, description="Display name")
    role: str = Field(default="user", pattern="^(user|admin)$", description="Role: 'user' or 'admin'")
