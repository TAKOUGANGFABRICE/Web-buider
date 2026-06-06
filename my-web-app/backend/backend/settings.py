from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me-in-production")

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = [BASE_DIR / "static"]

# Media files (uploads)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]

# Allow all CORS origins for development
CORS_ALLOW_ALL_ORIGINS = True

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PREMIUM_PRICE_ID = os.getenv("STRIPE_PREMIUM_PRICE_ID", "")
STRIPE_BUSINESS_PRICE_ID = os.getenv("STRIPE_BUSINESS_PRICE_ID", "")
STRIPE_SUCCESS_URL = os.getenv(
    "STRIPE_SUCCESS_URL", "http://localhost:3001/billing?success=true"
)
STRIPE_CANCEL_URL = os.getenv(
    "STRIPE_CANCEL_URL", "http://localhost:3001/billing?canceled=true"
)

# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY = os.getenv("FLUTTERWAVE_PUBLIC_KEY", "")
FLUTTERWAVE_SECRET_KEY = os.getenv("FLUTTERWAVE_SECRET_KEY", "")
FLUTTERWAVE_ENCRYPTION_KEY = os.getenv("FLUTTERWAVE_ENCRYPTION_KEY", "")
FLUTTERWAVE_WEBHOOK_SECRET = os.getenv("FLUTTERWAVE_WEBHOOK_SECRET", "")

# Frontend URL for callbacks
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

# Social Login Configuration
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.getenv("SOCIAL_AUTH_GOOGLE_OAUTH2_KEY", "")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.getenv("SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET", "")

SOCIAL_AUTH_FACEBOOK_KEY = os.getenv("SOCIAL_AUTH_FACEBOOK_KEY", "")
SOCIAL_AUTH_FACEBOOK_SECRET = os.getenv("SOCIAL_AUTH_FACEBOOK_SECRET", "")

# Authentication settings
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

SITE_ID = 1

LOGIN_REDIRECT_URL = "/"
ACCOUNT_LOGOUT_REDIRECT_URL = "/login/"

# File upload settings (500MB limit for zip files)
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000
