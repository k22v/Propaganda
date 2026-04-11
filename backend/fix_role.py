import asyncio
from app.database import async_session_maker
from sqlalchemy import text

async def fix():
    async with async_session_maker() as session:
        await session.execute(text("UPDATE users SET role = 'student' WHERE id = 2"))
        await session.commit()
        print('Fixed!')

asyncio.run(fix())
