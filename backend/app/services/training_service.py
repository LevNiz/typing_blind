"""Training service."""
from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.training_repository import TrainingRepository
from app.repositories.text_repository import TextRepository
from app.schemas.training import TrainingStartRequest, TrainingFinishRequest, TrainingSessionResponse
from app.models.training_session import TrainingMode


class TrainingService:
    """Service for training operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service with database session."""
        self.session = session
        self.training_repo = TrainingRepository(session)
        self.text_repo = TextRepository(session)

    async def start_training(
        self, request: TrainingStartRequest, user_id: UUID
    ) -> UUID:
        """
        Start a new training session.
        
        Returns:
            Training session ID
        """
        # Verify text exists if provided
        if request.text_id:
            text = await self.text_repo.get_by_id(request.text_id)
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Text not found",
                )
        
        # Create training session
        session = await self.training_repo.create(
            user_id=user_id,
            mode=request.mode,
            text_id=request.text_id,
        )
        
        return session.id

    async def finish_training(
        self,
        request: TrainingFinishRequest,
        user_id: UUID,
    ) -> TrainingSessionResponse:
        """
        Finish a training session and save results.
        
        Returns:
            Training session with results
        """
        # Verify session exists and belongs to user
        session = await self.training_repo.get_by_id(request.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Training session not found",
            )
        
        if session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to finish this training session",
            )
        
        # Update results
        updated_session = await self.training_repo.update_results(
            session_id=request.session_id,
            wpm=request.wpm,
            cpm=request.cpm,
            accuracy=request.accuracy,
            errors=request.errors,
            correct_chars=request.correct_chars,
            duration_sec=request.duration_sec,
        )
        
        if not updated_session:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update training session",
            )
        
        return TrainingSessionResponse.model_validate(updated_session)

    async def get_user_history(
        self,
        user_id: UUID,
        mode: Optional[TrainingMode] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[TrainingSessionResponse], int]:
        """Get training history for a user."""
        sessions, total = await self.training_repo.get_user_sessions(
            user_id=user_id,
            mode=mode,
            limit=limit,
            offset=offset,
        )
        return [TrainingSessionResponse.model_validate(session) for session in sessions], total

