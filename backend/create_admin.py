import asyncio
from app.database import get_db
from app.models import User
from sqlalchemy import select
from app.auth import get_password_hash

async def create_admin():
    async for db in get_db():
        result = await db.execute(select(User).where(User.username == 'admin'))
        user = result.scalar_one_or_none()
        
        if user:
            user.username = 'admin'
            user.email = 'admin@lms.com'
            user.hashed_password = get_password_hash('admin123')
            user.role = 'admin'
            user.is_superuser = True
            await db.commit()
            print('Admin updated!')
        else:
            user = User(
                username='admin',
                email='admin@lms.com',
                hashed_password=get_password_hash('admin123'),
                full_name='Admin',
                role='admin',
                is_superuser=True
            )
            db.add(user)
            await db.commit()
            print('Admin created!')
        
        break

asyncio.run(create_admin())
