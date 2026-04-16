"""
Background tasks service.

Handles async tasks like email sending, notifications, and statistics updates.
"""
import asyncio
from typing import Optional, List, Callable, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    id: str
    name: str
    status: TaskStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Optional[Any] = None


class BackgroundTaskRunner:
    """Simple background task runner."""
    
    def __init__(self):
        self.tasks: dict[str, Task] = {}
        self._running = False
    
    async def schedule(
        self,
        task_id: str,
        name: str,
        func: Callable,
        *args,
        **kwargs
    ) -> str:
        """Schedule a background task."""
        task = Task(
            id=task_id,
            name=name,
            status=TaskStatus.PENDING,
            created_at=datetime.utcnow()
        )
        self.tasks[task_id] = task
        
        # Run async
        asyncio.create_task(self._run_task(task_id, func, *args, **kwargs))
        return task_id
    
    async def _run_task(self, task_id: str, func: Callable, *args, **kwargs):
        """Internal task runner."""
        task = self.tasks.get(task_id)
        if not task:
            return
        
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()
        
        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            task.status = TaskStatus.COMPLETED
            task.result = result
            task.completed_at = datetime.utcnow()
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.utcnow()
            logger.error(f"Task {task_id} failed: {e}")
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task status."""
        return self.tasks.get(task_id)
    
    def list_tasks(self, status: Optional[TaskStatus] = None) -> List[Task]:
        """List tasks, optionally filtered by status."""
        tasks = list(self.tasks.values())
        if status:
            tasks = [t for t in tasks if t.status == status]
        return tasks


# Email queue
email_queue: List[dict] = []


async def queue_email(
    to: str,
    subject: str,
    body: str,
    html: Optional[str] = None
):
    """Add email to queue."""
    email_queue.append({
        "to": to,
        "subject": subject,
        "body": body,
        "html": html,
        "created_at": datetime.utcnow()
    })


async def process_email_queue():
    """Process email queue."""
    from app.services.email_service import send_email
    
    while email_queue:
        email = email_queue.pop(0)
        try:
            await send_email(**email)
            logger.info(f"Email sent to {email['to']}")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            # Re-add to queue for retry
            email_queue.append(email)
            break


# Notification queue
notification_queue: List[dict] = []


async def queue_notification(
    user_id: int,
    message: str,
    link: Optional[str] = None,
    notification_type: str = "info"
):
    """Add notification to queue."""
    notification_queue.append({
        "user_id": user_id,
        "message": message,
        "link": link,
        "type": notification_type,
        "created_at": datetime.utcnow()
    })


async def process_notification_queue():
    """Process notification queue."""
    from app.database import AsyncSessionLocal
    from app.models import Notification
    
    while notification_queue:
        notification = notification_queue.pop(0)
        async with AsyncSessionLocal() as db:
            try:
                notif = Notification(
                    user_id=notification["user_id"],
                    message=notification["message"],
                    type=notification["type"],
                    link=notification.get("link")
                )
                db.add(notif)
                await db.commit()
                logger.info(f"Notification sent to user {notification['user_id']}")
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")
                notification_queue.append(notification)
                break


# Scheduled tasks
async def cleanup_old_sessions():
    """Clean up expired sessions (placeholder)."""
    # Would clean up old sessions from database
    pass


async def recalculate_stats():
    """Recalculate course statistics (placeholder)."""
    # Would recalculate enrollment stats, quiz averages, etc.
    pass


async def send_daily_digest():
    """Send daily digest emails (placeholder)."""
    # Would send daily summary to users
    pass


# Task scheduler
async def start_scheduler():
    """Start background task scheduler."""
    while True:
        try:
            await process_email_queue()
            await process_notification_queue()
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
        
        await asyncio.sleep(5)  # Check every 5 seconds


# Initialize global runner
task_runner = BackgroundTaskRunner()