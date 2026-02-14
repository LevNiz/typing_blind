"""Admin stats service for statistics."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.user import User
from app.models.text import Text
from app.models.training_session import TrainingSession


class AdminStatsService:
    """Service for admin statistics operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_general_stats(self) -> dict:
        """Get general statistics."""
        # Count users
        users_count = await self.db.execute(select(func.count()).select_from(User))
        total_users = users_count.scalar_one()

        # Count active users (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        active_users_query = select(func.count(func.distinct(TrainingSession.user_id))).where(
            TrainingSession.created_at >= thirty_days_ago
        )
        active_users_result = await self.db.execute(active_users_query)
        active_users = active_users_result.scalar_one()

        # Count texts
        texts_count = await self.db.execute(select(func.count()).select_from(Text))
        total_texts = texts_count.scalar_one()

        # Count trainings
        trainings_count = await self.db.execute(select(func.count()).select_from(TrainingSession))
        total_trainings = trainings_count.scalar_one()

        # Average WPM and accuracy
        avg_stats = await self.db.execute(
            select(
                func.avg(TrainingSession.wpm).label("avg_wpm"),
                func.avg(TrainingSession.accuracy).label("avg_accuracy"),
            )
        )
        avg_result = avg_stats.first()
        avg_wpm = round(avg_result[0] or 0, 1) if avg_result else 0
        avg_accuracy = round(avg_result[1] or 0, 1) if avg_result else 0

        return {
            "total_users": total_users,
            "active_users_30d": active_users,
            "total_texts": total_texts,
            "total_trainings": total_trainings,
            "avg_wpm": avg_wpm,
            "avg_accuracy": avg_accuracy,
        }

    async def get_training_stats(self, period: str = "all") -> dict:
        """Get training statistics for a period."""
        query = select(TrainingSession)
        
        start_date = None
        if period == "day":
            start_date = datetime.now(timezone.utc) - timedelta(days=1)
            query = query.where(TrainingSession.created_at >= start_date)
        elif period == "week":
            start_date = datetime.now(timezone.utc) - timedelta(days=7)
            query = query.where(TrainingSession.created_at >= start_date)
        elif period == "month":
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
            query = query.where(TrainingSession.created_at >= start_date)

        # Get count
        count_query = select(func.count()).select_from(TrainingSession)
        if period != "all":
            count_query = count_query.where(TrainingSession.created_at >= start_date)
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        if total == 0:
            return {
                "period": period,
                "total": 0,
                "avg_wpm": 0,
                "avg_cpm": 0,
                "avg_accuracy": 0,
                "total_errors": 0,
            }

        # Get averages
        stats_query = select(
            func.avg(TrainingSession.wpm).label("avg_wpm"),
            func.avg(TrainingSession.cpm).label("avg_cpm"),
            func.avg(TrainingSession.accuracy).label("avg_accuracy"),
            func.sum(TrainingSession.errors).label("total_errors"),
        )
        if period != "all":
            stats_query = stats_query.where(TrainingSession.created_at >= start_date)
        
        stats_result = await self.db.execute(stats_query)
        stats = stats_result.first()

        return {
            "period": period,
            "total": total,
            "avg_wpm": round(stats[0] or 0, 1),
            "avg_cpm": round(stats[1] or 0, 1),
            "avg_accuracy": round(stats[2] or 0, 1),
            "total_errors": stats[3] or 0,
        }

    async def get_user_activity_stats(self) -> dict:
        """Get user activity statistics."""
        # Users registered in last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_users_query = select(func.count()).select_from(User).where(
            User.created_at >= thirty_days_ago
        )
        recent_users_result = await self.db.execute(recent_users_query)
        recent_users = recent_users_result.scalar_one()

        # Users with trainings in last 30 days
        active_users_query = select(func.count(func.distinct(TrainingSession.user_id))).where(
            TrainingSession.created_at >= thirty_days_ago
        )
        active_users_result = await self.db.execute(active_users_query)
        active_users = active_users_result.scalar_one()

        return {
            "recent_users_30d": recent_users,
            "active_users_30d": active_users,
        }

