from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.models import Website, Page, Template
from app.core.security import get_current_active_user
from app.schemas.website import (
    WebsiteCreate,
    WebsiteUpdate,
    WebsiteResponse,
    WebsiteDuplicateRequest,
)
from typing import List
from uuid import UUID

router = APIRouter()


@router.get("/", response_model=List[WebsiteResponse])
def list_websites(db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    return db.query(Website).filter(Website.owner_id == current_user.id).all()


@router.post("/", response_model=WebsiteResponse, status_code=201)
def create_website(payload: WebsiteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = Website(
        owner_id=current_user.id,
        name=payload.name,
        slug=payload.slug or payload.name.lower().replace(" ", "-"),
        subdomain=payload.subdomain,
        custom_domain=payload.custom_domain,
        template_id=payload.template_id,
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return website


@router.get("/{website_id}", response_model=WebsiteResponse)
def get_website(website_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.patch("/{website_id}", response_model=WebsiteResponse)
def update_website(website_id: UUID, payload: WebsiteUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(website, field, value)
    db.commit()
    db.refresh(website)
    return website


@router.delete("/{website_id}", status_code=204)
def delete_website(website_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    db.delete(website)
    db.commit()
    return None


@router.post("/{website_id}/duplicate", response_model=WebsiteResponse)
def duplicate_website(website_id: UUID, payload: WebsiteDuplicateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    source = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Website not found")
    new_website = Website(
        owner_id=current_user.id,
        name=payload.name,
        slug=payload.slug or f"{source.slug}-copy",
        template_id=source.template_id,
        seo_title=source.seo_title,
        seo_description=source.seo_description,
    )
    db.add(new_website)
    db.commit()
    db.refresh(new_website)
    return new_website

