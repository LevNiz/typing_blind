"""Leaderboard schemas."""
from uuid import UUID
from datetime import datetime
from typing import Optional
import enum
from pydantic import BaseModel, Field

from app.models.training_session import TrainingMode


class LeaderboardPeriod(str, enum.Enum):
    """Leaderboard period enum."""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    ALL = "all"


class LeaderboardEntry(BaseModel):
    """Leaderboard entry schema."""
    user_id: UUID
    username: str
    wpm: int
    cpm: int
    accuracy: float
    errors: int
    correct_chars: int
    duration_sec: int
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    """Leaderboard response schema."""
    items: list[LeaderboardEntry]
    total: int
    mode: TrainingMode
    period: str

