from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# -----------------------------------------------------------------------------
# 1. SQLAlchemy Async Engine with Production Connection Pooling
# -----------------------------------------------------------------------------
# The engine is the central factory for database connections.
# Instead of opening a new TCP connection on every API request (which is slow),
# the engine maintains a "pool" of warm, pre-authenticated connections in memory.
engine = create_async_engine(
    url=settings.DATABASE_URL,
    echo=settings.DEBUG,  # In debug mode, prints all SQL queries to console for easy learning!
    # --- CONNECTION POOL CONFIGURATION ---
    pool_size=10,  # Keep 10 active connections open in the pool at all times
    max_overflow=20,  # If traffic spikes, temporarily open up to 20 extra connections
    pool_recycle=1800,  # Refresh connections every 30 minutes to prevent stale memory leaks
    pool_pre_ping=True,  # Crucial for Cloud DBs (Neon): tests connection before using it
)

# -----------------------------------------------------------------------------
# 2. Async Session Maker
# -----------------------------------------------------------------------------
# A "Session" represents a single conversation/transaction with the database.
# expire_on_commit=False is CRITICAL for async Python:
# It ensures attributes remain accessible after commit without triggering
# accidental synchronous lazy-loading database queries.
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# -----------------------------------------------------------------------------
# 3. Declarative Base Class (Modern SQLAlchemy 2.0 style)
# -----------------------------------------------------------------------------
# All database models (User, Workspace, Project, Diagram) will inherit from this Base.
# It tells SQLAlchemy that this Python class corresponds to a database table.
class Base(DeclarativeBase):
    pass


# -----------------------------------------------------------------------------
# 4. FastAPI Dependency for Database Sessions
# -----------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Dependency that provides an asynchronous database session.

    ---------------------------------------------------------------------------
    HOW THIS WORKS:
    1. When an API endpoint with `db: AsyncSession = Depends(get_db)` is called,
       this function acquires a warm connection from the engine's pool.
    2. `yield session` hands the active database session over to the endpoint.
    3. The endpoint runs queries (`await session.execute(...)`).
    4. Once the endpoint finishes (or if an error occurs), the `finally:` block
       guarantees that `session.close()` is called and the connection returns
       safely back to the pool — ZERO CONNECTION LEAKS!
    ---------------------------------------------------------------------------
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
