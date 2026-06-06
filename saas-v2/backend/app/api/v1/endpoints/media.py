from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.core.models import Website, MediaAsset
from app.schemas.media import MediaUploadResponse
from uuid import UUID
import os, uuid as py_uuid, shutil
from PIL import Image
from app.core.config import settings

router = APIRouter()


@router.get("/websites/{website_id}/media", response_model=list[MediaUploadResponse])
def list_media(website_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return db.query(MediaAsset).filter(MediaAsset.website_id == website_id).order_by(MediaAsset.created_at.desc()).all()


@router.post("/websites/{website_id}/media/upload", response_model=MediaUploadResponse, status_code=201)
def upload_media(website_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    website = db.query(Website).filter(Website.id == website_id, Website.owner_id == current_user.id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")

    upload_dir = os.path.join(settings.MEDIA_ROOT, str(website_id))
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    filename = f"{py_uuid.uuid4().hex}{ext}"
    dest = os.path.join(upload_dir, filename)

    with open(dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    width = height = None
    try:
        with Image.open(dest) as img:
            width, height = img.size
    except Exception:
        pass

    media = MediaAsset(
        website_id=website_id,
        filename=file.filename or filename,
        file_path=dest,
        size_bytes=os.path.getsize(dest),
        width=width,
        height=height,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.get("/{media_id}/download")
def download_media(media_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return FileResponse(path=media.file_path, filename=media.filename)

