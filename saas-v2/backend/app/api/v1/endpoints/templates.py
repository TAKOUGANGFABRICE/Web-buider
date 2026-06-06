from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.core.models import Template
from app.schemas.template import TemplateResponse
from typing import List

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Template).filter(Template.is_active == True)
    if category:
        query = query.filter(Template.category == category)
    return query.order_by(Template.created_at.desc()).all()


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id, Template.is_active == True).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

