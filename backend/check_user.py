import asyncio
from app.database import get_db
from app.models import User
from app.auth import get_password_hash
from sqlalchemy import select

async def reset_password():
    async for db in get_db():
        result = await db.execute(select(User).where(User.username == 'lera'))
        user = result.scalar_one_or_none()
        if user:
            new_password = 'lera123'
            user.hashed_password = get_password_hash(new_password)
            await db.commit()
            print(f'Password reset for {user.username}: {new_password}')
        else:
            print('User not found')
        break

asyncio.run(reset_password())
