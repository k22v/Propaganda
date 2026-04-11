from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models_logging import UserActivityLog


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
    except Exception as e:
        print(f"Logging error: {e}")
        await db.rollback()
