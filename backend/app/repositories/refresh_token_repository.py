"""Refresh token repository."""
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    """Repository for refresh token operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self, user_id: UUID, token_hash: str, expires_at: datetime
    ) -> RefreshToken:
        """Create a new refresh token."""
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(token)
        await self.session.commit()
        await self.session.refresh(token)
        return token

    async def get_by_token_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Get refresh token by hash."""
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def get_valid_token(
        self, user_id: UUID, token_hash: str
    ) -> Optional[RefreshToken]:
        """Get valid (non-revoked, non-expired) refresh token."""
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.revoked == False,  # noqa: E712
                    RefreshToken.expires_at > now,
                )
            )
        )
        return result.scalar_one_or_none()

    async def revoke_token(self, token_hash: str) -> bool:
        """Revoke a refresh token."""
        token = await self.get_by_token_hash(token_hash)
        if token:
            token.revoked = True
            await self.session.commit()
            return True
        return False

    async def revoke_all_user_tokens(self, user_id: UUID) -> None:
        """Revoke all refresh tokens for a user."""
        result = await self.session.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked == False,  # noqa: E712
                )
            )
        )
        tokens = result.scalars().all()
        for token in tokens:
            token.revoked = True
        await self.session.commit()

