import asyncio
from app.database import async_session_maker
from app.models import User
from sqlalchemy import select

async def list_users():
    async with async_session_maker() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"ID:{u.id} | {u.username} | {u.email} | role:{u.role} | superuser:{u.is_superuser}")

asyncio.run(list_users())
