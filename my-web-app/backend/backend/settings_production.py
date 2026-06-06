# Production Settings for WaaS (Website Builder as a Service)
# These settings override the base settings when DEBUG=False

import os
from pathlib import Path
from .settings import *

# Security
DEBUG = False

# Get allowed hosts from environment or use defaults
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "your-domain.com,www.your-domain.com").split(
    ","
)

# Secret Key - Must be set via environment variable in production
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set in production")

# Database Configuration - Use MySQL in production (cPanel typically provides MySQL)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", os.getenv("MYSQL_DATABASE", "websitebuilder")),
        "USER": os.getenv("DB_USER", os.getenv("MYSQL_USER", "root")),
        "PASSWORD": os.getenv("DB_PASSWORD", os.getenv("MYSQL_PASSWORD", "")),
        "HOST": os.getenv("DB_HOST", os.getenv("MYSQL_HOST", "localhost")),
        "PORT": os.getenv("DB_PORT", os.getenv("MYSQL_PORT", "3306")),
        "OPTIONS": {
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            "charset": "utf8mb4",
        },
    }
}

# Static Files (CSS, JavaScript, Images)
# In production, these will be collected to STATIC_ROOT
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles_build")

# Media Files (User uploads)
# For cPanel, you may want to store media in a publicly accessible directory
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# URL paths for static and media (unchanged)
STATIC_URL = "/static/"
MEDIA_URL = "/media/"

# CORS - Restrict to your frontend domain in production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "https://your-domain.com,https://www.your-domain.com"
).split(",")

# Email Configuration - SMTP (Gmail recommended free tier)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

# CRITICAL: For Gmail SMTP, from email MUST match authenticated user
if EMAIL_HOST and "gmail" in EMAIL_HOST.lower() and EMAIL_HOST_USER:
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
else:
    DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@your-domain.com")

# Validate configuration
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    import sys
    print("⚠️  WARNING: EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not set!", file=sys.stderr)
    print("   Email sending will fail. Set these environment variables.", file=sys.stderr)

# Frontend URL for email confirmations, etc.
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://your-domain.com")

# Security Settings
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True") == "True"
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True") == "True"
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "True") == "True"
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session settings
SESSION_COOKIE_AGE = 86400 * 30  # 30 days
SESSION_SAVE_EVERY_REQUEST = True

# JWT Settings
SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"] = timedelta(minutes=60)

# Stripe - Use live keys in production
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PREMIUM_PRICE_ID = os.getenv("STRIPE_PREMIUM_PRICE_ID", "")
STRIPE_BUSINESS_PRICE_ID = os.getenv("STRIPE_BUSINESS_PRICE_ID", "")
STRIPE_SUCCESS_URL = os.getenv(
    "STRIPE_SUCCESS_URL", f"{FRONTEND_URL}/billing?success=true"
)
STRIPE_CANCEL_URL = os.getenv(
    "STRIPE_CANCEL_URL", f"{FRONTEND_URL}/billing?canceled=true"
)

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "file": {
            "level": "ERROR",
            "class": "logging.FileHandler",
            "filename": os.path.join(BASE_DIR, "logs", "django.log"),
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file"],
            "level": "ERROR",
            "propagate": True,
        },
    },
}
