from typing import Any
from psycopg.rows import dict_row
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class UpdateSettingsRequest(BaseModel):
    settings: dict[str, str]


@router.get("/")
async def get_settings(
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Get all system settings (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute("SELECT key, value FROM system_settings")
                rows = await cur.fetchall()
        settings = {row["key"]: row["value"] for row in rows}
        return json_response(True, settings, "Settings retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve settings: {str(e)}")


@router.patch("/")
async def update_settings(
    request_body: UpdateSettingsRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Update system settings (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                for key, value in request_body.settings.items():
                    await cur.execute(
                        """
                        INSERT INTO system_settings (key, value, updated_at)
                        VALUES (%s, %s, NOW())
                        ON CONFLICT (key) DO UPDATE
                        SET value = EXCLUDED.value, updated_at = NOW()
                        """,
                        (key, value),
                    )
                await conn.commit()
        return json_response(True, None, "Settings saved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to save settings: {str(e)}")