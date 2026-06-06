from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class TemplateResponse(BaseModel):
    id: UUID
    name: str
    category: str
    preview_image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_premium: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
