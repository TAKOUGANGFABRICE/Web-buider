from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class FormSubmissionResponse(BaseModel):
    id: UUID
    website_id: UUID
    form_name: str
    payload: dict
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FormSubmissionListResponse(BaseModel):
    items: list[FormSubmissionResponse]
    total: int

