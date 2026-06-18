import asyncio
from app.database import engine
from sqlalchemy import text

async def add_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE students ADD COLUMN profile_picture_url VARCHAR(500) NULL;"))
            print("Successfully added profile_picture_url to students table.")
        except Exception as e:
            print(f"Error adding column (it might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(add_column())
