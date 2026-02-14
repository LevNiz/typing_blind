"""Text schemas."""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.text import TextType


class TextBase(BaseModel):
    """Base text schema."""
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=10000)
    type: TextType
    language: Optional[str] = Field(None, max_length=50)
    is_public: bool = False


class TextCreate(TextBase):
    """Schema for text creation."""
    pass


class TextResponse(TextBase):
    """Text response schema."""
    id: UUID
    owner_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TextListResponse(BaseModel):
    """Response schema for list of texts."""
    items: list[TextResponse]
    total: int


class WikipediaTextResponse(BaseModel):
    """Schema for Wikipedia random article response."""
    title: str
    content: str
    url: str
    language: str

