from __future__ import annotations

from fastapi import APIRouter

from .endpoints import admin, auth, demo, health, training

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(demo.router)
api_router.include_router(training.router)
api_router.include_router(admin.router)
