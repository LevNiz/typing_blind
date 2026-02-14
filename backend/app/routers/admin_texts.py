"""Admin texts router."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.models.text import TextType
from app.schemas.text import TextResponse, TextCreate, TextListResponse
from app.services.admin_text_service import AdminTextService

router = APIRouter(prefix="/api/admin/texts", tags=["admin"])


@router.get("", response_model=TextListResponse)
async def get_all_texts(
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    type: TextType = Query(None, description="Filter by text type"),
    search: str = Query(None, description="Search by title or content"),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all texts (admin only)."""
    service = AdminTextService(db)
    texts, total = await service.get_all_texts(
        limit=limit,
        offset=offset,
        text_type=type,
        search=search,
    )
    return TextListResponse(items=texts, total=total)


@router.get("/{text_id}", response_model=TextResponse)
async def get_text(
    text_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get text by ID (admin only)."""
    try:
        text_uuid = UUID(text_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid text ID format",
        )
    
    service = AdminTextService(db)
    return await service.get_text_by_id(text_uuid)


@router.post("", response_model=TextResponse, status_code=status.HTTP_201_CREATED)
async def create_text(
    data: TextCreate,
    owner_id: str = Query(None, description="Owner user ID (defaults to admin user)"),
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create text (admin only)."""
    owner_uuid = admin_user.id
    if owner_id:
        try:
            owner_uuid = UUID(owner_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid owner ID format",
            )
    
    service = AdminTextService(db)
    return await service.create_text(data, owner_uuid)


@router.put("/{text_id}", response_model=TextResponse)
async def update_text(
    text_id: str,
    data: TextCreate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update text (admin only)."""
    try:
        text_uuid = UUID(text_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid text ID format",
        )
    
    service = AdminTextService(db)
    return await service.update_text(text_uuid, data)


@router.delete("/{text_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_text(
    text_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete text (admin only)."""
    try:
        text_uuid = UUID(text_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid text ID format",
        )
    
    service = AdminTextService(db)
    await service.delete_text(text_uuid)

