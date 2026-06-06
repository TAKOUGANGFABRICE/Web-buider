from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.core.models import Website, AnalyticsEvent
from app.schemas.analytics import AnalyticsOverviewResponse
from datetime import datetime, timedelta
from sqlalchemy import func, cast, Date
from collections import defaultdict

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def overview(
    website_id: str | None = Query(default=None),
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    website_q = db.query(Website).filter(Website.owner_id == current_user.id)
    website = website_q.first()
    if not website:
        raise HTTPException(status_code=404, detail="No website found")
    wid = website.id
    today = datetime.utcnow().date()
    start = today - timedelta(days=days)

    rows = (
        db.query(
            cast(AnalyticsEvent.created_at, Date).label("d"),
            AnalyticsEvent.event_type,
            func.count().label("c"),
        )
        .filter(AnalyticsEvent.website_id == wid, cast(AnalyticsEvent.created_at, Date) >= start)
        .group_by(cast(AnalyticsEvent.created_at, Date), AnalyticsEvent.event_type)
        .all()
    )

    totals = defaultdict(int)
    day_totals = defaultdict(int)
    for d, event_type, c in rows:
        totals[event_type] += int(c or 0)
        day_totals[str(d)] += int(c or 0)

    def prev_range(offset_days: int) -> int:
        prev_start = start - timedelta(days=offset_days)
        prev_end = today - timedelta(days=offset_days)
        return sum(
            v
            for k, v in day_totals.items()
            if prev_start <= datetime.fromisoformat(k).date() <= prev_end
        )

    def pct(cur: float, prev: float) -> float:
        if prev == 0:
            return 100.0 if cur else 0.0
        return round(((cur - prev) / prev) * 100, 2)

    visitors_today = day_totals.get(str(today), 0)
    visitors_yesterday = day_totals.get(str(today - timedelta(days=1)), 0)
    visitors_week = sum(
        v for k, v in day_totals.items() if datetime.fromisoformat(k).date() >= today - timedelta(days=7)
    )
    visitors_month = visitors_week if days == 7 else sum(
        v for k, v in day_totals.items() if datetime.fromisoformat(k).date() >= today - timedelta(days=30)
    )

    conversion_rate = round((totals.get("purchase", 0) / visitors_today) * 100, 2) if visitors_today else 0.0
    sales_today = float(totals.get("purchase", 0))
    sales_week = float(sum(totals.get("purchase", 0) for _ in range(7)))
    sales_month = float(sum(totals.get("purchase", 0) for _ in range(min(days, 30))))

    return AnalyticsOverviewResponse(
        visitors_today=visitors_today,
        visitors_yesterday=visitors_yesterday,
        visitors_week=visitors_week,
        visitors_month=visitors_month,
        visitors_change_today=pct(visitors_today, visitors_yesterday),
        visitors_change_week=pct(visitors_week, prev_range(7)),
        visitors_change_month=pct(visitors_month, prev_range(min(days, 30))),
        conversion_rate=conversion_rate,
        sales_today=sales_today,
        sales_week=sales_week,
        sales_month=sales_month,
        sales_change_today=pct(sales_today, float(prev_range(1))),
        sales_change_week=pct(sales_week, prev_range(7)),
        sales_change_month=pct(sales_month, prev_range(min(days, 30))),
    )
