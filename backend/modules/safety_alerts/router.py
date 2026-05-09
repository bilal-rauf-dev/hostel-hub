from typing import Any, Optional
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/safety-alerts", tags=["safety-alerts"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class CreateSafetyAlertRequest(BaseModel):
    title: Optional[str] = None
    target: Optional[str] = None
    body: Optional[str] = None
    message: Optional[str] = None
    severity: Optional[str] = None
    level: Optional[str] = None


@router.get("/")
async def get_safety_alerts(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Return safety alerts. Students only see active alerts, admins see all."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                if user.get("role") == "admin":
                    await cur.execute(
                        """
                        SELECT * FROM safety_alerts
                        ORDER BY created_at DESC
                        """,
                    )
                else:
                    await cur.execute(
                        """
                        SELECT * FROM safety_alerts
                        WHERE is_active = TRUE
                        ORDER BY created_at DESC
                        """,
                    )
                alerts = await cur.fetchall()

        return json_response(True, alerts, "Safety alerts retrieved")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve alerts: {str(e)}")


@router.post("/")
async def create_safety_alert(
    request_body: CreateSafetyAlertRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Create a new safety alert (admin only)."""
    try:
        title = request_body.title or request_body.target or "Safety Alert"
        body = request_body.body or request_body.message or ""
        severity = request_body.severity or request_body.level or "info"
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO safety_alerts (title, body, severity, is_active)
                    VALUES (%s, %s, %s, TRUE)
                    RETURNING *
                    """,
                    (title, body, severity),
                )
                new_alert = await cur.fetchone()
                await conn.commit()

        return json_response(True, new_alert, "Safety alert created")
    except Exception as e:
        return json_response(False, None, f"Failed to create alert: {str(e)}")


@router.patch("/{alert_id}")
async def toggle_safety_alert(
    alert_id: int,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Toggle the is_active state for an alert (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    UPDATE safety_alerts
                    SET is_active = NOT is_active
                    WHERE alert_id = %s
                    RETURNING *
                    """,
                    (alert_id,),
                )
                updated = await cur.fetchone()
                await conn.commit()

        if not updated:
            return json_response(False, None, "Alert not found")

        return json_response(True, updated, "Alert toggled")
    except Exception as e:
        return json_response(False, None, f"Failed to toggle alert: {str(e)}")
