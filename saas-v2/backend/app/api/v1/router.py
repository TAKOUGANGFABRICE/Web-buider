from app.api.v1.endpoints import auth, users, websites, pages, media, templates, forms, analytics, billing
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(websites.router, prefix="/websites", tags=["websites"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
