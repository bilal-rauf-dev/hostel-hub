from datetime import date
from typing import Any, Optional
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/lost-found", tags=["lost-found"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class PostLostFoundItemRequest(BaseModel):
    item_type: str
    description: str
    location_tag: Optional[str] = None
    location: Optional[str] = None
    item_date: Optional[date] = None
    is_anonymous: bool = False
    image_url: Optional[str] = None
    title: Optional[str] = None


@router.get("/")
async def get_lost_found_items(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get lost & found items (excluding archived, with anonymous reporter handling in SQL)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT lf.item_id, lf.item_type, lf.title, lf.description, lf.location_tag,
                           lf.item_date, lf.image_url, lf.is_anonymous, lf.is_archived, lf.status,
                           CASE WHEN is_anonymous = TRUE THEN NULL ELSE posted_by END as reporter,
                           CASE WHEN is_anonymous = TRUE THEN 'Anonymous' ELSE u.display_name END as reporter_name
                    FROM lost_found_items lf
                    LEFT JOIN users u ON lf.posted_by = u.user_id
                    WHERE is_archived = FALSE
                    ORDER BY lf.created_at DESC
                    """
                )
                items = await cur.fetchall()

        normalized_items = []
        for item in items:
            normalized_items.append(
                {
                    **item,
                    "title": item.get("title") or item["description"],
                    "location": item["location_tag"],
                    "posted_date": item["item_date"],
                }
            )
        
        return json_response(True, normalized_items, "Lost & found items retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve items: {str(e)}")


@router.post("/")
async def post_lost_found_item(
    request_body: PostLostFoundItemRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Post a lost or found item."""
    try:
        location_tag = request_body.location_tag or request_body.location
        title = request_body.title or request_body.description
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO lost_found_items
                    (item_type, title, description, location_tag, item_date, posted_by, is_anonymous, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING item_id, item_type, title, description, location_tag,
                              item_date, posted_by, is_anonymous, image_url
                    """,
                    (
                        request_body.item_type,
                        request_body.description,
                        request_body.title,
                        location_tag,
                        request_body.item_date,
                        user["user_id"],
                        request_body.is_anonymous,
                        request_body.image_url,
                    ),
                )
                item = await cur.fetchone()
                await conn.commit()

        if item:
            item = {
                **item,
                "title": item.get("title") or item["description"],
                "location": location_tag,
                "posted_date": item["item_date"],
            }
        
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
            async with conn.cursor(row_factory=dict_row) as cur:
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
                    RETURNING item_id, item_type, description, location_tag,
                              item_date, posted_by, is_anonymous, image_url, is_archived
                    """,
                    (item_id,),
                )
                archived_item = await cur.fetchone()
                await conn.commit()

        if archived_item:
            archived_item = {
                **archived_item,
                "title": archived_item["description"],
                "location": archived_item["location_tag"],
                "posted_date": archived_item["item_date"],
            }
        
        return json_response(True, archived_item, "Item archived successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to archive item: {str(e)}")


@router.patch("/{item_id}/resolve")
async def resolve_item(
    item_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Mark a lost item as found (poster or admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    "SELECT posted_by, item_type FROM lost_found_items WHERE item_id = %s",
                    (item_id,),
                )
                item = await cur.fetchone()

                if not item:
                    return json_response(False, None, "Item not found")

                if item["posted_by"] != user["user_id"] and user["role"] != "admin":
                    return json_response(False, None, "Not authorized to resolve this item")

                await cur.execute(
                    """
                    UPDATE lost_found_items
                    SET status = 'resolved'
                    WHERE item_id = %s
                    RETURNING item_id, status
                    """,
                    (item_id,),
                )
                updated = await cur.fetchone()
                await conn.commit()

        return json_response(True, updated, "Item marked as resolved")
    except Exception as e:
        return json_response(False, None, f"Failed to resolve item: {str(e)}")
