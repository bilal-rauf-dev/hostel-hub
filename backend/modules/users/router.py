from typing import Any, Optional
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    contact_number: Optional[str] = None
    profile_picture: Optional[str] = None
    room_number: Optional[str] = None


@router.get("/me")
async def get_current_user_profile(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get current user's profile information."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
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


@router.get("/me/summary")
async def get_user_summary(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get student summary counts."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT p_ticket_count, p_order_count, p_post_count, p_unread_notifications FROM get_student_summary(%s)",
                    (user["user_id"],)
                )
                result = await cur.fetchone()
                
        if not result:
            return json_response(False, None, "Failed to retrieve summary")
            
        return json_response(True, {
            "ticket_count": result[0],
            "order_count": result[1],
            "post_count": result[2],
            "unread_notifications": result[3]
        }, "Summary retrieved")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve summary: {str(e)}")


@router.patch("/me")
async def update_current_user_profile(
    request_body: UpdateProfileRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Update current user's profile information."""
    try:
        # Build dynamic update query
        updates = []
        params = []
        
        if request_body.display_name is not None:
            updates.append("display_name = %s")
            params.append(request_body.display_name)
        
        if request_body.contact_number is not None:
            updates.append("contact_number = %s")
            params.append(request_body.contact_number)
        
        if request_body.profile_picture is not None:
            updates.append("profile_picture = %s")
            params.append(request_body.profile_picture)

        if request_body.room_number is not None:
            updates.append("room_number = %s")
            params.append(request_body.room_number)
        
        if not updates:
            return json_response(False, None, "No fields to update")
        
        params.append(user["user_id"])
        update_clause = ", ".join(updates)
        
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
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

@router.get("/")
async def get_all_users(
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Get all users (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT user_id, email, student_id, display_name, contact_number,
                           room_number, role, is_verified, is_suspended, created_at
                    FROM users
                    ORDER BY created_at DESC
                    """
                )
                users = await cur.fetchall()
        return json_response(True, users, "Users retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve users: {str(e)}")

@router.get("/pending-verifications")
async def get_pending_verifications(
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Get users pending verification with their OTP (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT u.user_id, u.email, u.display_name, u.student_id, u.created_at,
                           o.otp_code, o.expires_at
                    FROM users u
                    LEFT JOIN LATERAL (
                        SELECT otp_code, expires_at
                        FROM otp_verifications
                        WHERE email = u.email AND is_used = FALSE
                        ORDER BY otp_id DESC LIMIT 1
                    ) o ON true
                    WHERE u.is_verified = FALSE
                    ORDER BY u.created_at DESC
                    """
                )
                pending_users = await cur.fetchall()
        return json_response(True, pending_users, "Pending verifications retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve pending verifications: {str(e)}")


import random
import string

@router.post("/{user_id}/resend-otp")
async def resend_otp(
    user_id: int,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Regenerate and resend OTP for a user (admin only)."""
    try:
        new_otp = ''.join(random.choices(string.digits, k=6))
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
                user_row = await cur.fetchone()
                if not user_row:
                    return json_response(False, None, "User not found")
                
                email = user_row["email"]
                
                await cur.execute(
                    "UPDATE otp_verifications SET is_used = TRUE WHERE email = %s AND is_used = FALSE",
                    (email,)
                )
                
                await cur.execute(
                    """
                    INSERT INTO otp_verifications (email, otp_code, expires_at)
                    VALUES (%s, %s, NOW() + INTERVAL '10 minutes')
                    RETURNING otp_code
                    """,
                    (email, new_otp)
                )
                await conn.commit()
                
        return json_response(True, {"otp_code": new_otp}, "OTP resent successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to resend OTP: {str(e)}")

@router.patch("/{user_id}/verify")
async def verify_user(
    user_id: int,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Mark a user as verified (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
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
            async with conn.cursor(row_factory=dict_row) as cur:
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
