from typing import Any

import psycopg
from fastapi import APIRouter, Depends

from auth.dependencies import get_current_user
from auth.dependencies import require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


@router.get("/me")
async def get_current_user_profile(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get current user's profile information."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    """
                    SELECT user_id, email, student_id, display_name, profile_picture,
                           contact_number, room_number, role, is_verified, is_suspended,
                           created_at
                    FROM users
                    WHERE user_id = %s
                    """,
                    (user["user_id"],),
                )
                profile = await cur.fetchone()
        
        if not profile:
            return json_response(False, None, "User not found")
        
        return json_response(True, profile, "Profile retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve profile: {str(e)}")


@router.patch("/me")
async def update_current_user_profile(
    display_name: str | None = None,
    contact_number: str | None = None,
    profile_picture: str | None = None,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Update current user's profile information."""
    try:
        # Build dynamic update query
        updates = []
        params = []
        
        if display_name is not None:
            updates.append("display_name = %s")
            params.append(display_name)
        
        if contact_number is not None:
            updates.append("contact_number = %s")
            params.append(contact_number)
        
        if profile_picture is not None:
            updates.append("profile_picture = %s")
            params.append(profile_picture)
        
        if not updates:
            return json_response(False, None, "No fields to update")
        
        params.append(user["user_id"])
        update_clause = ", ".join(updates)
        
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                await cur.execute(
                    f"""
                    UPDATE users
                    SET {update_clause}
                    WHERE user_id = %s
                    RETURNING user_id, email, student_id, display_name, profile_picture,
                              contact_number, room_number, role, is_verified, is_suspended,
                              created_at
                    """,
                    tuple(params),
                )
                updated_user = await cur.fetchone()
                await conn.commit()
        
        if not updated_user:
            return json_response(False, None, "Failed to update profile")
        
        return json_response(True, updated_user, "Profile updated successfully")
    except Exception as e:
        return json_response(False, None, f"Profile update failed: {str(e)}")


    @router.patch("/{user_id}/verify")
    async def verify_user(
        user_id: int,
        admin: dict = Depends(require_admin),
        pool=Depends(get_db_pool),
    ) -> dict:
        """Mark a user as verified (admin only)."""
        try:
            async with pool.connection() as conn:
                async with conn.cursor(row_factory=dict) as cur:
                    await cur.execute(
                        """
                        UPDATE users
                        SET is_verified = TRUE
                        WHERE user_id = %s
                        RETURNING user_id
                        """,
                        (user_id,),
                    )
                    res = await cur.fetchone()
                    await conn.commit()

            if not res:
                return json_response(False, None, "User not found")

            return json_response(True, None, "User verified")
        except Exception as e:
            return json_response(False, None, f"Failed to verify user: {str(e)}")


    @router.patch("/{user_id}/suspend")
    async def suspend_user(
        user_id: int,
        admin: dict = Depends(require_admin),
        pool=Depends(get_db_pool),
    ) -> dict:
        """Suspend a user account (admin only)."""
        try:
            async with pool.connection() as conn:
                async with conn.cursor(row_factory=dict) as cur:
                    await cur.execute(
                        """
                        UPDATE users
                        SET is_suspended = TRUE
                        WHERE user_id = %s
                        RETURNING user_id
                        """,
                        (user_id,),
                    )
                    res = await cur.fetchone()
                    await conn.commit()

            if not res:
                return json_response(False, None, "User not found")

            return json_response(True, None, "User suspended")
        except Exception as e:
            return json_response(False, None, f"Failed to suspend user: {str(e)}")
