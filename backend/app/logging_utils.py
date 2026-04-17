from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import UserActivityLog

import structlog
import logging
import sys
import os


def configure_logging():
    """Configure structured logging."""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level, logging.INFO),
    )
    
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer() if os.getenv("JSON_LOGS", "false").lower() == "true"
            else structlog.dev.ConsoleRenderer(colors=True),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str):
    return structlog.get_logger(name)


async def log_activity(
    db: AsyncSession,
    action: str,
    user_id: int = None,
    resource_type: str = None,
    resource_id: int = None,
    details: str = None,
    ip_address: str = None,
    user_agent: str = None
):
    try:
        log = UserActivityLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        await db.commit()
        
        logger = get_logger("activity")
        logger.info(
            "user_activity",
            action=action,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address
        )
    except Exception as e:
        print(f"Logging error: {e}")
        await db.rollback()
