from typing import Any

import psycopg
from fastapi import APIRouter, Depends

from auth.dependencies import get_current_user
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/lost-found", tags=["lost-found"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


@router.get("/")
async def get_lost_found_items(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get lost & found items (excluding archived, with anonymous reporter handling in SQL)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    """
                    SELECT item_id, item_type, title, description, location,
                           posted_date,
                           CASE WHEN is_anonymous = TRUE THEN NULL ELSE posted_by END as reporter,
                           CASE WHEN is_anonymous = TRUE THEN 'Anonymous' ELSE u.display_name END as reporter_name,
                           image_url, is_archived
                    FROM lost_found_items lf
                    LEFT JOIN users u ON lf.posted_by = u.user_id
                    WHERE is_archived = FALSE
                    ORDER BY posted_date DESC
                    """
                )
                items = await cur.fetchall()
        
        return json_response(True, items, "Lost & found items retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve items: {str(e)}")


@router.post("/")
async def post_lost_found_item(
    item_type: str,
    title: str,
    description: str,
    location: str,
    is_anonymous: bool = False,
    image_url: str | None = None,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Post a lost or found item."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    """
                    INSERT INTO lost_found_items
                    (item_type, title, description, location, posted_by, is_anonymous, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING item_id, item_type, title, description, location,
                              posted_date, posted_by, is_anonymous, image_url
                    """,
                    (item_type, title, description, location, user["user_id"], is_anonymous, image_url),
                )
                item = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, item, "Lost & found item posted successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to post item: {str(e)}")


@router.patch("/{item_id}/archive")
async def archive_item(
    item_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Archive a lost & found item (poster or admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                # Check ownership
                await cur.execute(
                    "SELECT posted_by FROM lost_found_items WHERE item_id = %s",
                    (item_id,),
                )
                item = await cur.fetchone()
                
                if not item:
                    return json_response(False, None, "Item not found")
                
                if item["posted_by"] != user["user_id"] and user["role"] != "admin":
                    return json_response(False, None, "Not authorized to archive this item")
                
                # Archive item
                await cur.execute(
                    """
                    UPDATE lost_found_items
                    SET is_archived = TRUE
                    WHERE item_id = %s
                    RETURNING item_id, item_type, title, description, location,
                              posted_date, posted_by, is_anonymous, image_url, is_archived
                    """,
                    (item_id,),
                )
                archived_item = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, archived_item, "Item archived successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to archive item: {str(e)}")
