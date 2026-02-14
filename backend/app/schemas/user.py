"""User schemas."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str


class UserInDB(UserBase):
    """User schema for database."""
    id: UUID
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserResponse(UserInDB):
    """User response schema."""
    pass


class UserUpdate(BaseModel):
    """Schema for user update."""
    email: EmailStr | None = None
    username: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None


class AdminUserListResponse(BaseModel):
    """Response schema for admin user list."""
    items: list[UserResponse]
    total: int

