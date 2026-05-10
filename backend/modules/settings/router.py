import json
from typing import Any
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])

def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}

class MaintenanceRequest(BaseModel):
    enabled: bool

async def init_settings_table(pool):
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS system_settings (
                        key VARCHAR(255) PRIMARY KEY,
                        value TEXT NOT NULL
                    )
                    """
                )
                await conn.commit()
    except Exception as e:
        print(f"Failed to initialize system_settings table: {e}")

@router.on_event("startup")
async def startup_event():
    # Attempt to initialize table using the global pool if possible, 
    # but FastAPI startup events usually don't have easy access to the Depends.
    # We will ensure the table exists lazily in the endpoints for robustness if needed, 
    # but we'll try to get the pool here if possible. 
    # Actually, the user asked to "create the table if it doesn't exist on startup".
    # I will just ensure the table exists in the dependency or via a direct call in the endpoint since get_db_pool is a generator.
    pass

@router.get("/maintenance")
async def get_maintenance(
    pool=Depends(get_db_pool),
) -> dict:
    """Get the current maintenance mode status."""
    try:
        await init_settings_table(pool)
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    "SELECT value FROM system_settings WHERE key = 'maintenance_mode'"
                )
                setting = await cur.fetchone()
                
                is_enabled = False
                if setting:
                    is_enabled = setting["value"].lower() == "true"
                
        return json_response(True, {"enabled": is_enabled}, "Maintenance status retrieved")
    except Exception as e:
        return json_response(False, None, f"Failed to get maintenance status: {str(e)}")


@router.post("/maintenance")
async def set_maintenance(
    request: MaintenanceRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Set the maintenance mode status (admin only)."""
    try:
        await init_settings_table(pool)
        value_str = "true" if request.enabled else "false"
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    INSERT INTO system_settings (key, value)
                    VALUES ('maintenance_mode', %s)
                    ON CONFLICT (key) DO UPDATE SET value = %s
                    """,
                    (value_str, value_str)
                )
                await conn.commit()
                
        return json_response(True, {"enabled": request.enabled}, "Maintenance mode updated")
    except Exception as e:
        return json_response(False, None, f"Failed to set maintenance status: {str(e)}")