import asyncio
from app.database import get_db
from app.models import User
from app.auth import get_password_hash

async def create_admin():
    async for db in get_db():
        user = User(
            username='moder',
            email='moder@admin.com',
            hashed_password=get_password_hash('moder123'),
            full_name='Moderator',
            is_superuser=True
        )
        db.add(user)
        await db.commit()
        print('Moderator created!')
        break

asyncio.run(create_admin())
