"""Admin stats router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.services.admin_stats_service import AdminStatsService

router = APIRouter(prefix="/api/admin/stats", tags=["admin"])


@router.get("")
async def get_general_stats(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get general statistics (admin only)."""
    service = AdminStatsService(db)
    return await service.get_general_stats()


@router.get("/trainings")
async def get_training_stats(
    period: str = Query("all", description="Period: day, week, month, all"),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get training statistics for a period (admin only)."""
    if period not in ["day", "week", "month", "all"]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid period. Must be: day, week, month, or all",
        )
    
    service = AdminStatsService(db)
    return await service.get_training_stats(period)


@router.get("/users")
async def get_user_activity_stats(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user activity statistics (admin only)."""
    service = AdminStatsService(db)
    return await service.get_user_activity_stats()

