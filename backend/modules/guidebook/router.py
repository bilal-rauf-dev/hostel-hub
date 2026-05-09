from typing import Any

import psycopg
from fastapi import APIRouter, Depends

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/guidebook", tags=["guidebook"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


@router.get("/")
async def get_guidebook_entries(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get guidebook entries ordered by category and date."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    """
                    SELECT entry_id, title, content, category, icon_url, created_at, updated_at
                    FROM guidebook_entries
                    ORDER BY category ASC, created_at ASC
                    """
                )
                entries = await cur.fetchall()
        
        return json_response(True, entries, "Guidebook entries retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve guidebook entries: {str(e)}")


@router.post("/")
async def create_guidebook_entry(
    title: str,
    content: str,
    category: str,
    icon_url: str | None = None,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Create a guidebook entry (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    """
                    INSERT INTO guidebook_entries (title, content, category, icon_url)
                    VALUES (%s, %s, %s, %s)
                    RETURNING entry_id, title, content, category, icon_url, created_at, updated_at
                    """,
                    (title, content, category, icon_url),
                )
                entry = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, entry, "Guidebook entry created successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to create guidebook entry: {str(e)}")


@router.patch("/{entry_id}")
async def update_guidebook_entry(
    entry_id: int,
    title: str | None = None,
    content: str | None = None,
    category: str | None = None,
    icon_url: str | None = None,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Update a guidebook entry (admin only)."""
    try:
        # Build dynamic update
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = %s")
            params.append(title)
        if content is not None:
            updates.append("content = %s")
            params.append(content)
        if category is not None:
            updates.append("category = %s")
            params.append(category)
        if icon_url is not None:
            updates.append("icon_url = %s")
            params.append(icon_url)
        
        if not updates:
            return json_response(False, None, "No fields to update")
        
        updates.append("updated_at = NOW()")
        params.append(entry_id)
        update_clause = ", ".join(updates)
        
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    f"""
                    UPDATE guidebook_entries
                    SET {update_clause}
                    WHERE entry_id = %s
                    RETURNING entry_id, title, content, category, icon_url, created_at, updated_at
                    """,
                    tuple(params),
                )
                updated_entry = await cur.fetchone()
                await conn.commit()
        
        if not updated_entry:
            return json_response(False, None, "Guidebook entry not found")
        
        return json_response(True, updated_entry, "Guidebook entry updated successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to update guidebook entry: {str(e)}")


@router.delete("/{entry_id}")
async def delete_guidebook_entry(
    entry_id: int,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Delete a guidebook entry (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    "DELETE FROM guidebook_entries WHERE entry_id = %s",
                    (entry_id,),
                )
                await conn.commit()
        
        return json_response(True, {"entry_id": entry_id}, "Guidebook entry deleted successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to delete guidebook entry: {str(e)}")
