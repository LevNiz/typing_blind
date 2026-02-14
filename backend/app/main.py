"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, users, texts, trainings, leaderboard
from app.routers import admin_users, admin_texts, admin_stats

app = FastAPI(
    title="Typing Trainer API",
    description="Backend API for typing trainer application",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(texts.router)
app.include_router(trainings.router)
app.include_router(leaderboard.router)
app.include_router(admin_users.router)
app.include_router(admin_texts.router)
app.include_router(admin_stats.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

