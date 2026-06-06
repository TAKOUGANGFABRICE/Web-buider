from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.core.models import Website, FormSubmission
from app.schemas.forms import FormSubmissionListResponse
from typing import List
from uuid import UUID

router = APIRouter()


@router.get("/websites/{website_id}/submissions", response_model=FormSubmissionListResponse)
def list_submissions(website_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    items = db.query(FormSubmission).filter(FormSubmission.website_id == website_id).order_by(FormSubmission.created_at.desc()).all()
    return FormSubmissionListResponse(items=items, total=len(items))
