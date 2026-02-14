"""Training session model."""
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional

from sqlalchemy import Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, func, TypeDecorator, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM
import enum

from app.core.database import Base


class TrainingMode(str, enum.Enum):
    """Training mode enum."""
    TEXT = "text"
    CODE = "code"


class TrainingModeDB(TypeDecorator):
    """Type decorator to ensure enum value is stored correctly."""
    impl = String
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        """Use PostgreSQL ENUM type for PostgreSQL."""
        if dialect.name == 'postgresql':
            # Use ENUM with native_enum=True to use PostgreSQL enum type
            # We handle conversion in process_bind_param and process_result_value
            return dialect.type_descriptor(
                ENUM(TrainingMode, name="training_mode", create_type=False, native_enum=True)
            )
        return dialect.type_descriptor(String(50))
    
    def process_bind_param(self, value, dialect):
        """Convert enum to its value before saving."""
        if value is None:
            return None
        if isinstance(value, TrainingMode):
            return value.value  # Return "text" or "code", not "TEXT" or "CODE"
        if isinstance(value, str):
            # If it's already a string, validate it's a valid enum value
            if value in [e.value for e in TrainingMode]:
                return value
        return str(value)
    
    def process_result_value(self, value, dialect):
        """Convert database value back to enum."""
        if value is None:
            return None
        # Value from DB is "text" or "code" (string), convert to enum
        if isinstance(value, str):
            # Try to find enum by value
            for enum_member in TrainingMode:
                if enum_member.value == value:
                    return enum_member
            # Fallback: try direct conversion
            return TrainingMode(value)
        return value


class TrainingSession(Base):
    """Training session model."""

    __tablename__ = "training_sessions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("texts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    mode: Mapped[TrainingMode] = mapped_column(
        TrainingModeDB(), nullable=False, index=True
    )
    wpm: Mapped[int] = mapped_column(Integer, nullable=False)
    cpm: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    errors: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_chars: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="training_sessions")
    text: Mapped[Optional["Text"]] = relationship("Text", back_populates="training_sessions")

