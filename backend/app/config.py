from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./lms.db")
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    remember_me_expire_days: int = 7


settings = Settings()
