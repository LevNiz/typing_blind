"""Leaderboard service."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.leaderboard_repository import LeaderboardRepository
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardPeriod, LeaderboardEntry
from app.models.training_session import TrainingMode


class LeaderboardService:
    """Service for leaderboard operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service with database session."""
        self.session = session
        self.leaderboard_repo = LeaderboardRepository(session)

    async def get_leaderboard(
        self,
        mode: TrainingMode,
        period: LeaderboardPeriod = LeaderboardPeriod.ALL,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "wpm",
    ) -> LeaderboardResponse:
        """
        Get leaderboard entries.
        
        Args:
            mode: Training mode (text or code)
            period: Time period (day, week, month, all)
            limit: Maximum number of entries
            offset: Offset for pagination
            sort_by: Sort by "wpm" or "accuracy"
        
        Returns:
            LeaderboardResponse with entries
        """
        entries, total = await self.leaderboard_repo.get_leaderboard(
            mode=mode,
            period=period,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
        )
        
        return LeaderboardResponse(
            items=entries,
            total=total,
            mode=mode,
            period=period.value,
        )

