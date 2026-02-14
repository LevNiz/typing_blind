"""Leaderboard router."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.training_session import TrainingMode
from app.services.leaderboard_service import LeaderboardService
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardPeriod

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    mode: TrainingMode = Query(..., description="Training mode (text or code)"),
    period: str = Query(
        "all", 
        description="Time period (day, week, month, all)"
    ),
    sort_by: str = Query(
        "wpm",
        regex="^(wpm|accuracy)$",
        description="Sort by wpm or accuracy"
    ),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get leaderboard entries.
    
    Returns average results per user for the specified mode and period.
    Each user appears once with their average performance (WPM, CPM, accuracy).
    Sorted by average WPM or accuracy (descending).
    """
    # Convert string to enum
    try:
        period_enum = LeaderboardPeriod(period.lower())
    except ValueError:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid period. Must be one of: {', '.join([p.value for p in LeaderboardPeriod])}"
        )
    
    service = LeaderboardService(db)
    return await service.get_leaderboard(
        mode=mode,
        period=period_enum,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
    )

