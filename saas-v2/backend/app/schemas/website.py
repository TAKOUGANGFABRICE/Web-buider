from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID


class PageBase(BaseModel):
    name: str
    slug: str
    title: Optional[str] = None
    is_homepage: bool = False
    sort_order: int = 0


class PageCreate(PageBase):
    pass


class PageUpdate(PageBase):
    name: Optional[str] = None
    slug: Optional[str] = None


class PageResponse(PageBase):
    id: UUID
    website_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebsiteBase(BaseModel):
    name: str
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class WebsiteCreate(WebsiteBase):
    slug: Optional[str] = None
    template_id: Optional[UUID] = None


class WebsiteUpdate(WebsiteBase):
    name: Optional[str] = None
    is_published: Optional[bool] = None


class WebsiteResponse(WebsiteBase):
    id: UUID
    slug: str
    owner_id: UUID
    is_published: bool
    pages: List[PageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebsiteDuplicateRequest(BaseModel):
    name: str
    slug: Optional[str] = None
