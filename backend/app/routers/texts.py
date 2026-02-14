"""Texts router."""
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.text import TextType
from app.services.text_service import TextService
from app.schemas.text import (
    TextCreate,
    TextResponse,
    TextListResponse,
    WikipediaTextResponse,
)
from app.services.wikipedia_service import WikipediaService

router = APIRouter(prefix="/api/texts", tags=["texts"])


@router.post("", response_model=TextResponse, status_code=status.HTTP_201_CREATED)
async def create_text(
    request: TextCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new text."""
    service = TextService(db)
    return await service.create_text(request, current_user.id)


@router.get("", response_model=TextListResponse)
async def get_texts(
    type: Optional[TextType] = Query(None, description="Filter by text type"),
    public: bool = Query(False, description="Get only public texts"),
    language: Optional[str] = Query(None, description="Filter by language"),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
):
    """Get texts with filtering."""
    service = TextService(db)
    
    if public:
        texts, total = await service.get_public_texts(
            text_type=type,
            language=language,
            limit=limit,
            offset=offset,
        )
    else:
        # If not public, return empty list (user should use /my endpoint)
        texts, total = [], 0
    
    return TextListResponse(items=texts, total=total)


@router.get("/my", response_model=TextListResponse)
async def get_my_texts(
    type: Optional[TextType] = Query(None, description="Filter by text type"),
    limit: int = Query(100, ge=1, le=1000, description="Limit number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's texts."""
    service = TextService(db)
    texts, total = await service.get_user_texts(
        owner_id=current_user.id,
        text_type=type,
        limit=limit,
        offset=offset,
    )
    return TextListResponse(items=texts, total=total)


@router.get("/{text_id}", response_model=TextResponse)
async def get_text(
    text_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get text by ID."""
    try:
        text_uuid = UUID(text_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid text ID format",
        )
    
    service = TextService(db)
    return await service.get_text_by_id(text_uuid)


@router.delete("/{text_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_text(
    text_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a text (only if owned by current user)."""
    try:
        text_uuid = UUID(text_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid text ID format",
        )
    
    service = TextService(db)
    await service.delete_text(text_uuid, current_user.id)


@router.get("/wikipedia/random", response_model=WikipediaTextResponse)
async def get_wikipedia_random(
    language: str = Query("ru", description="Wikipedia language code (e.g., 'ru', 'en')"),
    length: int = Query(500, ge=100, le=2000, description="Desired text length in characters"),
):
    """
    Get a random article from Wikipedia.
    
    Returns a random Wikipedia article with cleaned text suitable for typing practice.
    """
    service = WikipediaService()
    result = await service.get_random_article(
        language=language,
        min_length=100,
        max_length=length,
    )
    return WikipediaTextResponse(**result)

