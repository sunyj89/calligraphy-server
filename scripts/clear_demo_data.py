import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from scripts.seed_demo_data import clear_demo_data


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await clear_demo_data(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
