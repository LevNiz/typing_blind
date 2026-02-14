"""Authentication service."""
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
)
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.schemas.auth import RegisterRequest, LoginRequest
from app.schemas.user import UserResponse
from app.models.user import User


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service with database session."""
        self.session = session
        self.user_repo = UserRepository(session)
        self.token_repo = RefreshTokenRepository(session)

    async def register(self, request: RegisterRequest) -> tuple[UserResponse, str, str]:
        """
        Register a new user.

        Returns:
            Tuple of (user, access_token, refresh_token)
        """
        # Check if email is already taken
        if await self.user_repo.is_email_taken(request.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Check if username is already taken
        if await self.user_repo.is_username_taken(request.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

        # Create user
        password_hash = get_password_hash(request.password)
        user = await self.user_repo.create(
            email=request.email,
            username=request.username,
            password_hash=password_hash,
        )

        # Generate tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        # Hash and store refresh token
        refresh_token_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=7  # Should match REFRESH_TOKEN_EXPIRE_DAYS
        )
        await self.token_repo.create(
            user_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=expires_at,
        )

        return (
            UserResponse.model_validate(user),
            access_token,
            refresh_token,
        )

    async def login(self, request: LoginRequest) -> tuple[UserResponse, str, str]:
        """
        Login user.

        Returns:
            Tuple of (user, access_token, refresh_token)
        """
        # Get user by email
        user = await self.user_repo.get_by_email(request.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )

        # Generate tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        # Hash and store refresh token
        refresh_token_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await self.token_repo.create(
            user_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=expires_at,
        )

        return (
            UserResponse.model_validate(user),
            access_token,
            refresh_token,
        )

    async def refresh_access_token(
        self, refresh_token: str
    ) -> tuple[str, str]:
        """
        Refresh access token using refresh token.

        Returns:
            Tuple of (new_access_token, new_refresh_token)
        """
        # Decode refresh token
        payload = decode_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Check token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        # Get user ID
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID in token",
            )

        # Verify refresh token exists and is valid
        refresh_token_hash = hash_token(refresh_token)
        token_record = await self.token_repo.get_valid_token(
            user_id=user_id, token_hash=refresh_token_hash
        )

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        # Revoke old token (rotation)
        await self.token_repo.revoke_token(refresh_token_hash)

        # Generate new tokens
        new_access_token = create_access_token(data={"sub": str(user_id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user_id)})

        # Store new refresh token
        new_refresh_token_hash = hash_token(new_refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await self.token_repo.create(
            user_id=user_id,
            token_hash=new_refresh_token_hash,
            expires_at=expires_at,
        )

        return new_access_token, new_refresh_token

    async def logout(self, refresh_token: str) -> None:
        """Logout user by revoking refresh token."""
        # Decode refresh token to get user_id
        payload = decode_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Revoke token
        refresh_token_hash = hash_token(refresh_token)
        await self.token_repo.revoke_token(refresh_token_hash)

    async def get_current_user(self, user_id: UUID) -> User:
        """Get current user by ID."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled",
            )
        return user

