from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class MediaUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_path: str
    mime_type: str
    size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MediaListResponse(BaseModel):
    items: list[MediaUploadResponse]
    total: int

