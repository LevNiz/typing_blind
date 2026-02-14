"""Training schemas."""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.training_session import TrainingMode


class TrainingStartRequest(BaseModel):
    """Schema for starting a training session."""
    text_id: Optional[UUID] = None
    mode: TrainingMode


class TrainingFinishRequest(BaseModel):
    """Schema for finishing a training session."""
    session_id: UUID = Field(..., description="Training session ID")
    wpm: int = Field(..., ge=0, description="Words per minute")
    cpm: int = Field(..., ge=0, description="Characters per minute")
    accuracy: float = Field(..., ge=0.0, le=100.0, description="Accuracy percentage")
    errors: int = Field(..., ge=0, description="Number of errors")
    correct_chars: int = Field(..., ge=0, description="Number of correct characters")
    duration_sec: int = Field(..., ge=1, description="Duration in seconds")


class TrainingSessionResponse(BaseModel):
    """Training session response schema."""
    id: UUID
    user_id: UUID
    text_id: Optional[UUID]
    mode: TrainingMode
    wpm: int
    cpm: int
    accuracy: float
    errors: int
    correct_chars: int
    duration_sec: int
    created_at: datetime

    class Config:
        from_attributes = True


class TrainingHistoryResponse(BaseModel):
    """Response schema for training history."""
    items: list[TrainingSessionResponse]
    total: int


class TrainingStartResponse(BaseModel):
    """Response schema for training start."""
    session_id: UUID

