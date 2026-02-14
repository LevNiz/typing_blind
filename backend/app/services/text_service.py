"""Text service."""
from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.text_repository import TextRepository
from app.schemas.text import TextCreate, TextResponse
from app.models.text import Text, TextType


class TextService:
    """Service for text operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service with database session."""
        self.session = session
        self.text_repo = TextRepository(session)

    async def create_text(
        self, request: TextCreate, owner_id: UUID
    ) -> TextResponse:
        """Create a new text."""
        text = await self.text_repo.create(
            title=request.title,
            content=request.content,
            text_type=request.type,
            language=request.language,
            is_public=request.is_public,
            owner_id=owner_id,
        )
        return TextResponse.model_validate(text)

    async def get_public_texts(
        self,
        text_type: Optional[TextType] = None,
        language: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[TextResponse], int]:
        """Get public texts with filtering."""
        texts, total = await self.text_repo.get_public_texts(
            text_type=text_type,
            language=language,
            limit=limit,
            offset=offset,
        )
        return [TextResponse.model_validate(text) for text in texts], total

    async def get_user_texts(
        self,
        owner_id: UUID,
        text_type: Optional[TextType] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[TextResponse], int]:
        """Get texts owned by a user."""
        texts, total = await self.text_repo.get_user_texts(
            owner_id=owner_id,
            text_type=text_type,
            limit=limit,
            offset=offset,
        )
        return [TextResponse.model_validate(text) for text in texts], total

    async def get_text_by_id(self, text_id: UUID) -> TextResponse:
        """Get text by ID."""
        text = await self.text_repo.get_by_id(text_id)
        if not text:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text not found",
            )
        return TextResponse.model_validate(text)

    async def delete_text(self, text_id: UUID, owner_id: UUID) -> None:
        """Delete a text (only if owned by user)."""
        deleted = await self.text_repo.delete(text_id, owner_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text not found or you don't have permission to delete it",
            )

