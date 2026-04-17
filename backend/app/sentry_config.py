"""
Sentry monitoring configuration.
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os


def init_sentry():
    """Initialize Sentry if DSN is configured."""
    dsn = os.getenv("SENTRY_DSN")
    
    if not dsn:
        return None
    
    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            FastApiIntegration(transaction_style="url"),
            SqlalchemyIntegration(),
            LoggingIntegration(level=20, event_level=40),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
        release=os.getenv("VERSION", "1.0.0"),
        send_default_pii=True,
        attach_stacktrace=True,
        max_breadcrumbs=50,
    )
    
    return sentry_sdk


def get_sentry_user_context(user_id: int = None, email: str = None, username: str = None):
    """Get user context for Sentry."""
    if not user_id:
        return
    
    return {
        "id": user_id,
        "email": email,
        "username": username,
    }


def set_sentry_user(user_id: int = None, email: str = None, username: str = None):
    """Set user context in Sentry."""
    if user_id and sentry_sdk.get_client().is_active:
        sentry_sdk.set_user({
            "id": str(user_id),
            "email": email,
            "username": username,
        })
