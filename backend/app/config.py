from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./lms.db")
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    remember_me_expire_days: int = 7

    def __init__(self, **kwargs):
        # Require SECRET_KEY in production
        secret = os.getenv("SECRET_KEY")
        if not secret:
            # For development only - warn user
            import warnings
            warnings.warn("SECRET_KEY not set! Using insecure default for development.")
            secret = "dev-secret-change-in-production"
        kwargs["secret_key"] = secret
        super().__init__(**kwargs)


settings = Settings()
