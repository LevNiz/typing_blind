#!/usr/bin/env python3
"""Script to make a user admin."""
import asyncio
import sys
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.user import User
from app.config import settings


async def make_admin(email_or_username: str):
    """Make a user admin by email or username."""
    # Create database connection
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Find user by email or username
        stmt = select(User).where(
            (User.email == email_or_username) | (User.username == email_or_username)
        )
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            print(f"User with email/username '{email_or_username}' not found!")
            return False

        if user.is_admin:
            print(f"User '{user.username}' ({user.email}) is already an admin!")
            return True

        # Make user admin
        user.is_admin = True
        await session.commit()
        print(f"User '{user.username}' ({user.email}) is now an admin!")
        return True


async def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email_or_username>")
        print("Example: python make_admin.py user@example.com")
        print("Example: python make_admin.py myusername")
        sys.exit(1)

    email_or_username = sys.argv[1]
    success = await make_admin(email_or_username)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())

