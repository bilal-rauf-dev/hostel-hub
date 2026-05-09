from datetime import datetime
from typing import Any

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import sql

from auth.dependencies import get_current_user
from auth.utils import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from core.config import settings
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


@router.post("/register")
async def register(
    email: str,
    password: str,
    display_name: str,
    student_id: str,
    contact_number: str | None = None,
    pool=Depends(get_db_pool),
) -> dict:
    """Register a new user. Calls the register_user stored procedure."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                # Call stored procedure: SELECT * FROM register_user($1, $2, $3, $4, $5)
                password_hash = hash_password(password)
                await cur.execute(
                    """
                    SELECT * FROM register_user(%s, %s, %s, %s, %s)
                    """,
                    (email, password_hash, display_name, student_id, contact_number or ""),
                )
                result = await cur.fetchone()
                
        if not result or not result.get("user_id"):
            return json_response(
                False,
                None,
                "Failed to create user"
            )
        
        # Generate OTP code for response (in production, would email this)
        otp_code = "1234"  # Placeholder - in production would be random 4-digit
        
        return json_response(
            True,
            {
                "user_id": result.get("user_id"),
                "email": result.get("email"),
                "otp_code": otp_code,  # Return OTP for development (no email service)
                "message": "Registration successful. Verify your OTP to complete signup."
            },
            "Registration successful"
        )
    except psycopg.errors.UniqueViolation as e:
        return json_response(False, None, "Email already registered")
    except Exception as e:
        return json_response(False, None, f"Registration failed: {str(e)}")


@router.post("/verify-otp")
async def verify_otp(
    email: str,
    otp_code: str,
    pool=Depends(get_db_pool),
) -> dict:
    """Verify OTP and mark user as verified."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                # Check if OTP is valid
                await cur.execute(
                    """
                    SELECT otp_id, user_id FROM otp_verifications
                    WHERE email = %s AND otp_code = %s 
                      AND is_used = FALSE 
                      AND expires_at > NOW()
                    LIMIT 1
                    """,
                    (email, otp_code),
                )
                otp_record = await cur.fetchone()
                
                if not otp_record:
                    return json_response(False, None, "Invalid or expired OTP")
                
                # Mark OTP as used
                await cur.execute(
                    "UPDATE otp_verifications SET is_used = TRUE WHERE otp_id = %s",
                    (otp_record["otp_id"],),
                )
                
                # Mark user as verified
                await cur.execute(
                    "UPDATE users SET is_verified = TRUE WHERE user_id = %s",
                    (otp_record["user_id"],),
                )
                
                await conn.commit()
        
        return json_response(True, {"email": email}, "OTP verified successfully")
    except Exception as e:
        return json_response(False, None, f"OTP verification failed: {str(e)}")


@router.post("/login")
async def login(
    email: str,
    password: str,
    pool=Depends(get_db_pool),
) -> dict:
    """Login with email and password. Returns access and refresh tokens."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict) as cur:
                # Get user by email
                await cur.execute(
                    """
                    SELECT user_id, email, password_hash, display_name, role, 
                           is_verified, is_suspended
                    FROM users
                    WHERE email = %s
                    """,
                    (email,),
                )
                user = await cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if verified
        if not user["is_verified"]:
            raise HTTPException(status_code=403, detail="User not verified. Please verify OTP first.")
        
        # Check if suspended
        if user["is_suspended"]:
            raise HTTPException(status_code=403, detail="User account is suspended")
        
        # Generate tokens
        token_data = {
            "sub": str(user["user_id"]),
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"]
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return json_response(
            True,
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "display_name": user["display_name"],
                    "role": user["role"]
                }
            },
            "Login successful"
        )
    except HTTPException:
        raise
    except Exception as e:
        return json_response(False, None, f"Login failed: {str(e)}")


@router.post("/refresh")
async def refresh_token(
    refresh_token: str,
) -> dict:
    """Issue a new access token using refresh token."""
    try:
        payload = decode_token(refresh_token)
        
        token_data = {
            "sub": payload.get("sub"),
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "role": payload.get("role")
        }
        
        access_token = create_access_token(token_data)
        
        return json_response(
            True,
            {
                "access_token": access_token,
                "token_type": "bearer"
            },
            "Access token refreshed"
        )
    except HTTPException:
        raise
    except Exception as e:
        return json_response(False, None, f"Token refresh failed: {str(e)}")


@router.post("/logout")
async def logout(
    user: dict = Depends(get_current_user),
) -> dict:
    """Logout (stateless - client should discard token)."""
    return json_response(True, None, "Logout successful")
