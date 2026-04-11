import os
import asyncio
from app.database import init_db

async def main():
    await init_db()
    print("Database initialized!")

asyncio.run(main())