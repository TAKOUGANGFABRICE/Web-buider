from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class SubscriptionResponse(BaseModel):
    id: UUID
    plan: str
    status: str
    stripe_customer_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str

