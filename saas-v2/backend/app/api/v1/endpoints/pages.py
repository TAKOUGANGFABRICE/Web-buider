from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.core.models import Website, Page
from app.schemas.website import PageCreate, PageUpdate, PageResponse
from typing import List
from uuid import UUID

router = APIRouter()


def get_website_or_404(db: Session, website_id: UUID, user_id: UUID) -> Website:
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == user_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.get("/websites/{website_id}/pages", response_model=List[PageResponse])
def list_pages(website_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    get_website_or_404(db, website_id, current_user.id)
    return db.query(Page).filter(Page.website_id == website_id).order_by(Page.sort_order).all()


@router.post("/websites/{website_id}/pages", response_model=PageResponse, status_code=201)
def create_page(website_id: UUID, payload: PageCreate, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = get_website_or_404(db, website_id, current_user.id)
    page = Page(website_id=website.id, **payload.model_dump())
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.get("/websites/{website_id}/pages/{page_id}", response_model=PageResponse)
def get_page(website_id: UUID, page_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    get_website_or_404(db, website_id, current_user.id)
    page = db.query(Page).filter(Page.id == page_id, Page.website_id == website_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.patch("/websites/{website_id}/pages/{page_id}", response_model=PageResponse)
def update_page(website_id: UUID, page_id: UUID, payload: PageUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    get_website_or_404(db, website_id, current_user.id)
    page = db.query(Page).filter(Page.id == page_id, Page.website_id == website_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(page, field, value)
    db.commit()
    db.refresh(page)
    return page


@router.delete("/websites/{website_id}/pages/{page_id}", status_code=204)
def delete_page(website_id: UUID, page_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    get_website_or_404(db, website_id, current_user.id)
    page = db.query(Page).filter(Page.id == page_id, Page.website_id == website_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    db.delete(page)
    db.commit()
    return None


@router.post("/websites/{website_id}/pages/{page_id}/duplicate", response_model=PageResponse, status_code=201)
def duplicate_page(website_id: UUID, page_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = get_website_or_404(db, website_id, current_user.id)
    page = db.query(Page).filter(Page.id == page_id, Page.website_id == website_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    new_page = Page(
        website_id=website.id,
        name=f"{page.name} copy",
        slug=f"{page.slug}-copy",
        title=page.title,
        is_homepage=False,
        sort_order=page.sort_order + 1,
    )
    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return new_page

