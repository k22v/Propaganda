import asyncio
from app.database import get_db
from app.models import User
from app.auth import get_password_hash

async def create_admin():
    async for db in get_db():
        user = User(
            username='admin',
            email='admin@admin.com',
            hashed_password=get_password_hash('admin123'),
            full_name='Super Admin',
            is_superuser=True
        )
        db.add(user)
        await db.commit()
        print('Admin created!')
        break

asyncio.run(create_admin())
