"""Trainings router."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.training_session import TrainingMode
from app.services.training_service import TrainingService
from app.schemas.training import (
    TrainingStartRequest,
    TrainingStartResponse,
    TrainingFinishRequest,
    TrainingSessionResponse,
    TrainingHistoryResponse,
)

router = APIRouter(prefix="/api/trainings", tags=["trainings"])


@router.post("/start", response_model=TrainingStartResponse, status_code=status.HTTP_201_CREATED)
async def start_training(
    request: TrainingStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new training session."""
    service = TrainingService(db)
    session_id = await service.start_training(request, current_user.id)
    return TrainingStartResponse(session_id=session_id)


@router.post("/finish", response_model=TrainingSessionResponse)
async def finish_training(
    request: TrainingFinishRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Finish a training session and save results."""
    service = TrainingService(db)
    return await service.finish_training(request, current_user.id)


@router.get("/history", response_model=TrainingHistoryResponse)
async def get_training_history(
    mode: Optional[TrainingMode] = Query(None, description="Filter by training mode"),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get training history for current user."""
    service = TrainingService(db)
    sessions, total = await service.get_user_history(
        user_id=current_user.id,
        mode=mode,
        limit=limit,
        offset=offset,
    )
    return TrainingHistoryResponse(items=sessions, total=total)

