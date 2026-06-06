from typing import AsyncIterator

from fastapi import FastAPI, Request
from psycopg_pool import AsyncConnectionPool

from core.config import settings


def create_db_pool() -> AsyncConnectionPool:
    return AsyncConnectionPool(conninfo=settings.database_url, open=False, kwargs={"autocommit": True, "sslmode": "require",})


async def init_db_pool(app: FastAPI) -> None:
    app.state.db_pool = create_db_pool()
    await app.state.db_pool.open()


async def close_db_pool(app: FastAPI) -> None:
    pool = getattr(app.state, "db_pool", None)
    if pool is not None:
        await pool.close()
        app.state.db_pool = None


async def get_db_pool(request: Request) -> AsyncIterator[AsyncConnectionPool]:
    pool = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise RuntimeError("Database pool is not initialized")
    yield pool
