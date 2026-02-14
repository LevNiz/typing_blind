"""Admin text service for managing texts."""
from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.repositories.text_repository import TextRepository
from app.schemas.text import TextResponse, TextCreate, TextListResponse
from app.models.text import Text, TextType


class AdminTextService:
    """Service for admin text operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.text_repo = TextRepository(db)

    async def get_all_texts(
        self,
        limit: int = 100,
        offset: int = 0,
        text_type: Optional[TextType] = None,
        search: Optional[str] = None,
    ) -> tuple[list[TextResponse], int]:
        """Get all texts with optional filtering."""
        # Use raw SQL to avoid enum issues (same approach as in TextRepository)
        from sqlalchemy import text as sql_text
        
        conditions = []
        params = {}
        
        if text_type:
            text_type_value = text_type.value if isinstance(text_type, TextType) else str(text_type)
            conditions.append("type = CAST(:text_type AS text_type)")
            params["text_type"] = text_type_value
        
        if search:
            conditions.append("(title ILIKE :search OR content ILIKE :search)")
            params["search"] = f"%{search}%"
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        # Get total count
        count_result = await self.db.execute(
            sql_text(f"SELECT COUNT(*) FROM texts WHERE {where_clause}"),
            params
        )
        total = count_result.scalar_one()
        
        # Get texts with pagination
        result = await self.db.execute(
            sql_text(f"""
                SELECT id, title, content, type::text, language, is_public, owner_id, created_at
                FROM texts
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {**params, "limit": limit, "offset": offset}
        )
        
        # Convert rows to TextResponse objects
        # Create Text objects first (same approach as in TextRepository)
        texts = []
        for row in result:
            text = Text()
            text.id = row[0]
            text.title = row[1]
            text.content = row[2]
            text.type = TextType(row[3])  # Convert string to enum
            text.language = row[4]
            text.is_public = row[5]
            text.owner_id = row[6]
            text.created_at = row[7]
            # Convert Text object to TextResponse using from_attributes
            texts.append(TextResponse.model_validate(text))
        
        return texts, total

    async def get_text_by_id(self, text_id: UUID) -> TextResponse:
        """Get text by ID."""
        text = await self.text_repo.get_by_id(text_id)
        if not text:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text not found",
            )
        return TextResponse.model_validate(text)

    async def create_text(self, data: TextCreate, owner_id: UUID) -> TextResponse:
        """Create text (admin can create text for any user)."""
        text = await self.text_repo.create(
            title=data.title,
            content=data.content,
            text_type=data.type,
            language=data.language,
            is_public=data.is_public,
            owner_id=owner_id,
        )
        return TextResponse.model_validate(text)

    async def update_text(self, text_id: UUID, data: TextCreate) -> TextResponse:
        """Update text."""
        text = await self.text_repo.get_by_id(text_id)
        if not text:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text not found",
            )

        # Update fields - need to use raw SQL for enum handling
        from sqlalchemy import text as sql_text
        await self.db.execute(
            sql_text("""
                UPDATE texts
                SET title = :title,
                    content = :content,
                    type = CAST(:type AS text_type),
                    language = :language,
                    is_public = :is_public
                WHERE id = CAST(:id AS uuid)
            """),
            {
                "id": str(text_id),
                "title": data.title,
                "content": data.content,
                "type": data.type.value,
                "language": data.language,
                "is_public": data.is_public,
            }
        )
        await self.db.commit()
        
        # Fetch updated text
        updated_text = await self.text_repo.get_by_id(text_id)
        return TextResponse.model_validate(updated_text)

    async def delete_text(self, text_id: UUID) -> None:
        """Delete text."""
        # First check if text exists
        text = await self.text_repo.get_by_id(text_id)
        if not text:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text not found",
            )

        # Use raw SQL to delete (text object from raw SQL is not bound to session)
        from sqlalchemy import text as sql_text
        result = await self.db.execute(
            sql_text("DELETE FROM texts WHERE id = CAST(:id AS uuid)"),
            {"id": str(text_id)}
        )
        await self.db.commit()
        
        # Check if any row was deleted
        if result.rowcount == 0:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Text not found",
            )

