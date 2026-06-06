import os
from app.core.config import settings


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")


settings = Settings()

