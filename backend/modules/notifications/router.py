from typing import Any
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends

from auth.dependencies import get_current_user
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


@router.get("/")
async def get_notifications(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get user's notifications with unread_count as separate field."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Get all notifications
                await cur.execute(
                    """
                    SELECT notification_id, user_id, title, body, is_read, created_at
                    FROM notifications
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    """,
                    (user["user_id"],),
                )
                notifications = await cur.fetchall()
                
                # Get unread count
                await cur.execute(
                    """
                    SELECT COUNT(*) as unread_count
                    FROM notifications
                    WHERE user_id = %s AND is_read = FALSE
                    """,
                    (user["user_id"],),
                )
                unread_result = await cur.fetchone()
                unread_count = unread_result["unread_count"] if unread_result else 0
        
        return json_response(
            True,
            {
                "notifications": notifications,
                "unread_count": unread_count
            },
            "Notifications retrieved successfully"
        )
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve notifications: {str(e)}")


@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Mark a notification as read."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Check ownership
                await cur.execute(
                    "SELECT user_id FROM notifications WHERE notification_id = %s",
                    (notification_id,),
                )
                notification = await cur.fetchone()
                
                if not notification:
                    return json_response(False, None, "Notification not found")
                
                if notification["user_id"] != user["user_id"]:
                    return json_response(False, None, "Not authorized to update this notification")
                
                # Mark as read
                await cur.execute(
                    """
                    UPDATE notifications
                    SET is_read = TRUE
                    WHERE notification_id = %s
                    RETURNING notification_id, user_id, title, message, notification_type,
                              related_id, is_read, created_at
                    """,
                    (notification_id,),
                )
                updated_notification = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, updated_notification, "Notification marked as read")
    except Exception as e:
        return json_response(False, None, f"Failed to mark notification as read: {str(e)}")


@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Mark all user notifications as read."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    UPDATE notifications
                    SET is_read = TRUE
                    WHERE user_id = %s AND is_read = FALSE
                    """,
                    (user["user_id"],),
                )
                await conn.commit()
        
        return json_response(True, None, "All notifications marked as read")
    except Exception as e:
        return json_response(False, None, f"Failed to mark all notifications as read: {str(e)}")
