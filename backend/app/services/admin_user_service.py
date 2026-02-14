"""Admin user service for managing users."""
from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, UserUpdate, AdminUserListResponse
from app.models.user import User


class AdminUserService:
    """Service for admin user operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_all_users(
        self,
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> tuple[list[UserResponse], int]:
        """Get all users with optional search."""
        query = select(User)
        count_query = select(func.count()).select_from(User)

        if search:
            search_filter = or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Get users
        query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        users = result.scalars().all()

        return [UserResponse.model_validate(user) for user in users], total

    async def get_user_by_id(self, user_id: UUID) -> UserResponse:
        """Get user by ID."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return UserResponse.model_validate(user)

    async def update_user(self, user_id: UUID, data: UserUpdate) -> UserResponse:
        """Update user."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        
        # Check for email/username conflicts if updating
        if "email" in update_data and update_data["email"] != user.email:
            if await self.user_repo.is_email_taken(update_data["email"], exclude_user_id=user_id):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken",
                )
        
        if "username" in update_data and update_data["username"] != user.username:
            if await self.user_repo.is_username_taken(update_data["username"], exclude_user_id=user_id):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken",
                )

        # Apply updates
        for key, value in update_data.items():
            setattr(user, key, value)

        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)

    async def delete_user(self, user_id: UUID) -> None:
        """Delete user (cascade delete will handle related records)."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        await self.db.delete(user)
        await self.db.commit()

    async def get_user_stats(self, user_id: UUID) -> dict:
        """Get statistics for a user."""
        from app.repositories.training_repository import TrainingRepository
        
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        training_repo = TrainingRepository(self.db)
        sessions, total = await training_repo.get_user_sessions(
            user_id=user_id,
            limit=1000,  # Get all sessions for stats
        )

        if total == 0:
            return {
                "total_trainings": 0,
                "avg_wpm": 0,
                "avg_cpm": 0,
                "avg_accuracy": 0,
                "total_errors": 0,
                "total_texts": 0,
            }

        total_wpm = sum(s.wpm for s in sessions)
        total_cpm = sum(s.cpm for s in sessions)
        total_accuracy = sum(s.accuracy for s in sessions)
        total_errors = sum(s.errors for s in sessions)

        # Get user's texts count
        from app.repositories.text_repository import TextRepository
        text_repo = TextRepository(self.db)
        user_texts, texts_total = await text_repo.get_user_texts(
            owner_id=user_id,
            limit=1000,
        )

        return {
            "total_trainings": total,
            "avg_wpm": round(total_wpm / total, 1) if total > 0 else 0,
            "avg_cpm": round(total_cpm / total, 1) if total > 0 else 0,
            "avg_accuracy": round(total_accuracy / total, 1) if total > 0 else 0,
            "total_errors": total_errors,
            "total_texts": texts_total,
        }

