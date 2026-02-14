"""Leaderboard repository."""
from uuid import UUID
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import text as sql_text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.training_session import TrainingMode
from app.schemas.leaderboard import LeaderboardPeriod, LeaderboardEntry


class LeaderboardRepository:
    """Repository for leaderboard operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session."""
        self.session = session

    def _get_period_filter(self, period: LeaderboardPeriod) -> tuple[Optional[str], Optional[datetime]]:
        """Get SQL filter for period."""
        now = datetime.now(timezone.utc)
        
        if period == LeaderboardPeriod.DAY:
            start_date = now - timedelta(days=1)
            return "ts.created_at >= :start_date", start_date
        elif period == LeaderboardPeriod.WEEK:
            start_date = now - timedelta(weeks=1)
            return "ts.created_at >= :start_date", start_date
        elif period == LeaderboardPeriod.MONTH:
            start_date = now - timedelta(days=30)
            return "ts.created_at >= :start_date", start_date
        elif period == LeaderboardPeriod.ALL:
            return None, None
        return None, None

    async def get_leaderboard(
        self,
        mode: TrainingMode,
        period: LeaderboardPeriod = LeaderboardPeriod.ALL,
        limit: int = 100,
        offset: int = 0,
        sort_by: str = "wpm",  # "wpm" or "accuracy"
    ) -> tuple[list[LeaderboardEntry], int]:
        """
        Get leaderboard entries.
        
        Returns average results per user (grouped by user).
        Each user appears once with their average performance.
        
        Returns:
            Tuple of (list of entries, total count)
        """
        mode_value = mode.value if isinstance(mode, TrainingMode) else str(mode)
        
        # Build conditions
        conditions = ["mode = CAST(:mode AS training_mode)"]
        params = {"mode": mode_value}
        
        period_filter, start_date = self._get_period_filter(period)
        if period_filter and start_date:
            conditions.append(period_filter)
            params["start_date"] = start_date
        
        where_clause = " AND ".join(conditions)
        
        # Determine sort column
        sort_column = "wpm" if sort_by == "wpm" else "accuracy"
        sort_order = "DESC"
        
        # Get average results per user
        # Calculate average WPM, CPM, accuracy, etc. for each user
        query = f"""
            SELECT 
                ts.user_id,
                u.username,
                ROUND(AVG(ts.wpm)::numeric, 1) as avg_wpm,
                ROUND(AVG(ts.cpm)::numeric, 1) as avg_cpm,
                ROUND(AVG(ts.accuracy)::numeric, 1) as avg_accuracy,
                SUM(ts.errors) as total_errors,
                SUM(ts.correct_chars) as total_correct_chars,
                SUM(ts.duration_sec) as total_duration_sec,
                MAX(ts.created_at) as last_training_at,
                COUNT(*) as training_count
            FROM training_sessions ts
            JOIN users u ON ts.user_id = u.id
            WHERE {where_clause}
              AND ts.duration_sec > 0  -- Only completed sessions
            GROUP BY ts.user_id, u.username
            ORDER BY avg_{sort_column} DESC, avg_accuracy DESC
            LIMIT :limit OFFSET :offset
        """
        
        # Get total count (unique users)
        count_query = f"""
            SELECT COUNT(DISTINCT user_id)
            FROM training_sessions ts
            WHERE {where_clause}
              AND ts.duration_sec > 0
        """
        
        # Get total count
        count_result = await self.session.execute(
            sql_text(count_query),
            params
        )
        total = count_result.scalar_one()
        
        # Get leaderboard entries
        result = await self.session.execute(
            sql_text(query),
            {**params, "limit": limit, "offset": offset}
        )
        
        # Convert rows to LeaderboardEntry objects
        # Note: We use average values for wpm/cpm/accuracy, and totals for errors/correct_chars/duration
        entries = []
        for row in result:
            entry = LeaderboardEntry(
                user_id=row[0],
                username=row[1],
                wpm=int(round(row[2])),  # avg_wpm rounded to int
                cpm=int(round(row[3])),  # avg_cpm rounded to int
                accuracy=float(row[4]),  # avg_accuracy
                errors=int(row[5]),  # total_errors
                correct_chars=int(row[6]),  # total_correct_chars
                duration_sec=int(row[7]),  # total_duration_sec
                created_at=row[8],  # last_training_at
            )
            entries.append(entry)
        
        return entries, total

