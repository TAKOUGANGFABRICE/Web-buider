from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.models import User
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.schemas.auth import UserCreate, TokenResponse, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, hashed_password=payload.password, full_name=payload.full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or user.hashed_password != form_data.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh, user=user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: dict):
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token is required")
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access = create_access_token(payload.get("sub"))
    refresh = create_refresh_token(payload.get("sub"))
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        pass
    return MessageResponse(message="If the email exists, a reset link was sent.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = body.new_password
    db.commit()
    return MessageResponse(message="Password reset successfully")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
