from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class AnalyticsOverviewResponse(BaseModel):
    visitors_today: int
    visitors_yesterday: int
    visitors_week: int
    visitors_month: int
    visitors_change_today: float
    visitors_change_week: float
    visitors_change_month: float
    conversion_rate: float
    sales_today: float
    sales_week: float
    sales_month: float
    sales_change_today: float
    sales_change_week: float
    sales_change_month: float

