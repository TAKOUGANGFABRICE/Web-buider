from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Numeric,
    Integer,
    JSON,
    Enum,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum
import uuid


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"


class PlanType(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    websites = relationship("Website", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plan = Column(Enum(PlanType), default=PlanType.FREE)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="subscriptions")


class Website(Base):
    __tablename__ = "websites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    subdomain = Column(String(255), nullable=True, unique=True)
    custom_domain = Column(String(255), nullable=True)
    is_published = Column(Boolean, default=False)
    template_id = Column(UUID(as_uuid=True), nullable=True)
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="websites")
    pages = relationship("Page", back_populates="website", cascade="all, delete-orphan")
    media = relationship("MediaAsset", back_populates="website", cascade="all, delete-orphan")


class Page(Base):
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id = Column(UUID(as_uuid=True), ForeignKey("websites.id"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    title = Column(String(255), nullable=True)
    is_homepage = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    website = relationship("Website", back_populates="pages")


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id = Column(UUID(as_uuid=True), ForeignKey("websites.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    website = relationship("Website", back_populates="media")


class Template(Base):
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)
    preview_image_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    layout_json = Column(JSON, nullable=False)
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id = Column(UUID(as_uuid=True), ForeignKey("websites.id"), nullable=False)
    form_name = Column(String(255), nullable=False)
    payload = Column(JSON, nullable=False)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id = Column(UUID(as_uuid=True), ForeignKey("websites.id"), nullable=False)
    session_id = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False)
    page_url = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)
    device_type = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(50), default="draft")
    stripe_invoice_id = Column(String(255), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
