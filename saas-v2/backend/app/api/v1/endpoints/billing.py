from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_active_user
from app.schemas.billing import SubscriptionResponse, CheckoutSessionResponse, BillingPortalResponse
from app.db.session import SessionLocal
from app.core.models import Subscription, PlanType
from uuid import UUID

router = APIRouter()


@router.get("/subscription", response_model=SubscriptionResponse)
def get_subscription(current_user=Depends(get_current_active_user)):
    db = SessionLocal()
    try:
        sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
        if not sub:
            sub = Subscription(user_id=current_user.id, plan=PlanType.FREE)
            db.add(sub)
            db.commit()
            db.refresh(sub)
        return sub
    finally:
        db.close()


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout(plan: str = "starter", current_user=Depends(get_current_active_user)):
    return CheckoutSessionResponse(checkout_url=f"/billing/checkout?plan={plan}")


@router.post("/portal", response_model=BillingPortalResponse)
def billing_portal(current_user=Depends(get_current_active_user)):
    return BillingPortalResponse(portal_url="/billing/portal")
