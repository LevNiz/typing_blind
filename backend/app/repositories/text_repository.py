"""Text repository."""
from uuid import UUID, uuid4
from typing import Optional

from sqlalchemy import select, and_, func, text as sql_text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.text import Text, TextType


class TextRepository:
    """Repository for text operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session."""
        self.session = session

    async def get_by_id(self, text_id: UUID) -> Optional[Text]:
        """Get text by ID."""
        # Use raw SQL to read with proper enum handling
        # This bypasses SQLAlchemy's enum handling which incorrectly converts values
        result = await self.session.execute(
            sql_text("""
                SELECT id, title, content, type::text, language, is_public, owner_id, created_at
                FROM texts
                WHERE id = CAST(:id AS uuid)
            """),
            {"id": str(text_id)}
        )
        row = result.first()
        if not row:
            return None
        
        # Manually construct Text object with proper enum conversion
        text = Text()
        text.id = row[0]
        text.title = row[1]
        text.content = row[2]
        text.type = TextType(row[3])  # Convert string "text" or "code" to enum
        text.language = row[4]
        text.is_public = row[5]
        text.owner_id = row[6]
        text.created_at = row[7]
        return text

    async def create(
        self,
        title: str,
        content: str,
        text_type: TextType,
        owner_id: UUID,
        language: Optional[str] = None,
        is_public: bool = False,
    ) -> Text:
        """Create a new text."""
        # Convert enum to its value (string) to ensure correct storage
        # SQLAlchemy with asyncpg passes enum name instead of value, so we use raw SQL
        text_type_value = text_type.value if isinstance(text_type, TextType) else str(text_type)
        text_id = uuid4()
        
        # Use raw SQL to insert with correct enum value
        # This bypasses SQLAlchemy's enum handling which incorrectly uses enum name
        # SQLAlchemy text() converts named parameters to positional for asyncpg
        await self.session.execute(
            sql_text("""
                INSERT INTO texts (id, title, content, type, language, is_public, owner_id)
                VALUES (CAST(:id AS uuid), :title, :content, CAST(:type AS text_type), :language, :is_public, CAST(:owner_id AS uuid))
            """),
            {
                "id": str(text_id),
                "title": title,
                "content": content,
                "type": text_type_value,  # Use value directly ("text" or "code")
                "language": language,
                "is_public": is_public,
                "owner_id": str(owner_id),
            }
        )
        await self.session.commit()
        
        # Fetch the created text
        return await self.get_by_id(text_id)

    async def get_public_texts(
        self,
        text_type: Optional[TextType] = None,
        language: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Text], int]:
        """
        Get public texts with optional filtering.
        
        Returns:
            Tuple of (list of texts, total count)
        """
        # Build query using raw SQL to avoid enum issues
        conditions = ["is_public = true"]
        params = {}
        
        if text_type:
            text_type_value = text_type.value if isinstance(text_type, TextType) else str(text_type)
            conditions.append("type = CAST(:text_type AS text_type)")
            params["text_type"] = text_type_value
        
        if language:
            conditions.append("language = :language")
            params["language"] = language
        
        where_clause = " AND ".join(conditions)
        
        # Get total count
        count_result = await self.session.execute(
            sql_text(f"SELECT COUNT(*) FROM texts WHERE {where_clause}"),
            params
        )
        total = count_result.scalar_one()
        
        # Get texts with pagination
        result = await self.session.execute(
            sql_text(f"""
                SELECT id, title, content, type::text, language, is_public, owner_id, created_at
                FROM texts
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {**params, "limit": limit, "offset": offset}
        )
        
        # Convert rows to Text objects
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
            texts.append(text)
        
        return texts, total

    async def get_user_texts(
        self,
        owner_id: UUID,
        text_type: Optional[TextType] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Text], int]:
        """
        Get texts owned by a user.
        
        Returns:
            Tuple of (list of texts, total count)
        """
        # Build query using raw SQL to avoid enum issues
        conditions = ["owner_id = CAST(:owner_id AS uuid)"]
        params = {"owner_id": str(owner_id)}
        
        if text_type:
            text_type_value = text_type.value if isinstance(text_type, TextType) else str(text_type)
            conditions.append("type = CAST(:text_type AS text_type)")
            params["text_type"] = text_type_value
        
        where_clause = " AND ".join(conditions)
        
        # Get total count
        count_result = await self.session.execute(
            sql_text(f"SELECT COUNT(*) FROM texts WHERE {where_clause}"),
            params
        )
        total = count_result.scalar_one()
        
        # Get texts with pagination
        result = await self.session.execute(
            sql_text(f"""
                SELECT id, title, content, type::text, language, is_public, owner_id, created_at
                FROM texts
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {**params, "limit": limit, "offset": offset}
        )
        
        # Convert rows to Text objects
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
            texts.append(text)
        
        return texts, total

    async def delete(self, text_id: UUID, owner_id: UUID) -> bool:
        """Delete a text (only if owned by user)."""
        text = await self.get_by_id(text_id)
        if text and text.owner_id == owner_id:
            await self.session.delete(text)
            await self.session.commit()
            return True
        return False

