import asyncio
from app.database import get_db
from app.models import User
from sqlalchemy import select

async def reset_admin():
    async for db in get_db():
        result = await db.execute(select(User).where(User.username == 'liza'))
        user = result.scalar_one_or_none()
        
        if user:
            await db.delete(user)
            await db.commit()
            print('User deleted')
        
        break

asyncio.run(reset_admin())
