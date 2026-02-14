"""Training session repository."""
from uuid import UUID, uuid4
from typing import Optional

from sqlalchemy import select, and_, func, text as sql_text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.training_session import TrainingSession, TrainingMode


class TrainingRepository:
    """Repository for training session operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session."""
        self.session = session

    async def get_by_id(self, session_id: UUID) -> Optional[TrainingSession]:
        """Get training session by ID."""
        # Use raw SQL to read with proper enum handling
        result = await self.session.execute(
            sql_text("""
                SELECT id, user_id, text_id, mode::text, wpm, cpm, accuracy, errors, correct_chars, duration_sec, created_at
                FROM training_sessions
                WHERE id = CAST(:id AS uuid)
            """),
            {"id": str(session_id)}
        )
        row = result.first()
        if not row:
            return None
        
        # Manually construct TrainingSession object with proper enum conversion
        session = TrainingSession()
        session.id = row[0]
        session.user_id = row[1]
        session.text_id = row[2]
        session.mode = TrainingMode(row[3])  # Convert string "text" or "code" to enum
        session.wpm = row[4]
        session.cpm = row[5]
        session.accuracy = row[6]
        session.errors = row[7]
        session.correct_chars = row[8]
        session.duration_sec = row[9]
        session.created_at = row[10]
        return session

    async def create(
        self,
        user_id: UUID,
        mode: TrainingMode,
        text_id: Optional[UUID] = None,
    ) -> TrainingSession:
        """Create a new training session."""
        # Convert enum to its value (string) to ensure correct storage
        mode_value = mode.value if isinstance(mode, TrainingMode) else str(mode)
        session_id = uuid4()
        
        # Use raw SQL to insert with correct enum value
        if text_id:
            await self.session.execute(
                sql_text("""
                    INSERT INTO training_sessions (id, user_id, text_id, mode, wpm, cpm, accuracy, errors, correct_chars, duration_sec)
                    VALUES (CAST(:id AS uuid), CAST(:user_id AS uuid), CAST(:text_id AS uuid), CAST(:mode AS training_mode), 0, 0, 0.0, 0, 0, 0)
                """),
                {
                    "id": str(session_id),
                    "user_id": str(user_id),
                    "text_id": str(text_id),
                    "mode": mode_value,  # Use value directly ("text" or "code")
                }
            )
        else:
            await self.session.execute(
                sql_text("""
                    INSERT INTO training_sessions (id, user_id, text_id, mode, wpm, cpm, accuracy, errors, correct_chars, duration_sec)
                    VALUES (CAST(:id AS uuid), CAST(:user_id AS uuid), NULL, CAST(:mode AS training_mode), 0, 0, 0.0, 0, 0, 0)
                """),
                {
                    "id": str(session_id),
                    "user_id": str(user_id),
                    "mode": mode_value,  # Use value directly ("text" or "code")
                }
            )
        await self.session.commit()
        
        # Fetch the created session
        return await self.get_by_id(session_id)

    async def update_results(
        self,
        session_id: UUID,
        wpm: int,
        cpm: int,
        accuracy: float,
        errors: int,
        correct_chars: int,
        duration_sec: int,
    ) -> Optional[TrainingSession]:
        """Update training session results."""
        # Use raw SQL to update results
        await self.session.execute(
            sql_text("""
                UPDATE training_sessions
                SET wpm = :wpm, cpm = :cpm, accuracy = :accuracy, errors = :errors,
                    correct_chars = :correct_chars, duration_sec = :duration_sec
                WHERE id = CAST(:session_id AS uuid)
            """),
            {
                "session_id": str(session_id),
                "wpm": wpm,
                "cpm": cpm,
                "accuracy": accuracy,
                "errors": errors,
                "correct_chars": correct_chars,
                "duration_sec": duration_sec,
            }
        )
        await self.session.commit()
        
        # Fetch the updated session
        return await self.get_by_id(session_id)

    async def get_user_sessions(
        self,
        user_id: UUID,
        mode: Optional[TrainingMode] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[TrainingSession], int]:
        """
        Get training sessions for a user.
        
        Returns:
            Tuple of (list of sessions, total count)
        """
        # Build query using raw SQL to avoid enum issues
        conditions = ["user_id = CAST(:user_id AS uuid)"]
        params = {"user_id": str(user_id)}
        
        if mode:
            mode_value = mode.value if isinstance(mode, TrainingMode) else str(mode)
            conditions.append("mode = CAST(:mode AS training_mode)")
            params["mode"] = mode_value
        
        where_clause = " AND ".join(conditions)
        
        # Get total count
        count_result = await self.session.execute(
            sql_text(f"SELECT COUNT(*) FROM training_sessions WHERE {where_clause}"),
            params
        )
        total = count_result.scalar_one()
        
        # Get sessions with pagination
        result = await self.session.execute(
            sql_text(f"""
                SELECT id, user_id, text_id, mode::text, wpm, cpm, accuracy, errors, correct_chars, duration_sec, created_at
                FROM training_sessions
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            {**params, "limit": limit, "offset": offset}
        )
        
        # Convert rows to TrainingSession objects
        sessions = []
        for row in result:
            session = TrainingSession()
            session.id = row[0]
            session.user_id = row[1]
            session.text_id = row[2]
            session.mode = TrainingMode(row[3])  # Convert string to enum
            session.wpm = row[4]
            session.cpm = row[5]
            session.accuracy = row[6]
            session.errors = row[7]
            session.correct_chars = row[8]
            session.duration_sec = row[9]
            session.created_at = row[10]
            sessions.append(session)
        
        return sessions, total

