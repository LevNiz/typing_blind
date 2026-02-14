"""Text model."""
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey, Boolean, Enum as SQLEnum, func, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM
import enum

from app.core.database import Base


class TextType(str, enum.Enum):
    """Text type enum."""
    TEXT = "text"
    CODE = "code"


class TextTypeColumn(TypeDecorator):
    """Type decorator to ensure enum value (not name) is stored."""
    impl = String
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        """Use PostgreSQL ENUM type for PostgreSQL."""
        if dialect.name == 'postgresql':
            # Use ENUM with native_enum=True to use PostgreSQL enum type
            # We handle conversion in process_bind_param and process_result_value
            return dialect.type_descriptor(
                ENUM(TextType, name="text_type", create_type=False, native_enum=True)
            )
        return dialect.type_descriptor(String(50))
    
    def process_bind_param(self, value, dialect):
        """Convert enum to its value before saving."""
        if value is None:
            return None
        if isinstance(value, TextType):
            return value.value  # Return "text" or "code", not "TEXT" or "CODE"
        if isinstance(value, str):
            # If it's already a string, validate it's a valid enum value
            if value in [e.value for e in TextType]:
                return value
        return str(value)
    
    def process_result_value(self, value, dialect):
        """Convert database value back to enum."""
        if value is None:
            return None
        # Value from DB is "text" or "code" (string), convert to enum
        if isinstance(value, str):
            # Try to find enum by value
            for enum_member in TextType:
                if enum_member.value == value:
                    return enum_member
            # Fallback: try direct conversion
            return TextType(value)
        return value




class Text(Base):
    """Text model."""

    __tablename__ = "texts"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(String(10000), nullable=False)
    type: Mapped[TextType] = mapped_column(
        TextTypeColumn(), nullable=False, index=True
    )
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    owner_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @validates('type')
    def validate_type(self, key, value):
        """Convert enum to its value before saving."""
        if isinstance(value, TextType):
            return value.value  # Return "text" or "code", not "TEXT" or "CODE"
        return value

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="texts")
    training_sessions: Mapped[list["TrainingSession"]] = relationship(
        "TrainingSession", back_populates="text", cascade="all, delete-orphan"
    )

