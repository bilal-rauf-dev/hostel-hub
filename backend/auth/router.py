from datetime import datetime
from typing import Any, Optional
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import sql
from psycopg.rows import dict_row

from auth.dependencies import get_current_user
from auth.utils import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from core.config import settings
from database.connection import get_db_pool
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str
    student_id: str
    room_number: str
    contact_number: Optional[str] = None


@router.post("/register")
async def register(
    request_body: RegisterRequest,
    pool=Depends(get_db_pool),
) -> dict:
    """Register a new user. Calls the register_user stored procedure."""
    # Debug: print incoming payload
    print("Register payload:", request_body.model_dump())

    if len(request_body.password) > 72:
        return json_response(False, None, "Password cannot be longer than 72 characters")
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cursor:
                hashed_password = hash_password(request_body.password)
                query = """
                    SELECT * FROM register_user(%s, %s, %s, %s, %s)
                """
                params = (
                    request_body.email,
                    request_body.student_id,
                    request_body.display_name,
                    hashed_password,
                    request_body.room_number,
                )
                await cursor.execute(query, params)
                row = await cursor.fetchone()
                print("Register row:", row)

                if not row or not row.get("user_id"):
                    return json_response(False, None, row.get("result") if row else "Registration failed")

                await conn.commit()

                await cursor.execute(
                    "SELECT otp_code FROM otp_verifications WHERE email = %s AND is_used = FALSE ORDER BY otp_id DESC LIMIT 1",
                    (request_body.email,)
                )
                otp_row = await cursor.fetchone()
                otp_code = otp_row["otp_code"] if otp_row else "000000"

        return json_response(
            True,
            {
                "user_id": row["user_id"],
                "otp_code": otp_code,
                "message": "Registration successful. Verify your OTP to complete signup."
            },
            "Registration successful"
        )
    except psycopg.errors.UniqueViolation:
        return json_response(False, None, "Email already registered")
    except Exception as e:
        return json_response(False, None, f"Registration failed: {str(e)}")

class VerifyOtpRequest(BaseModel):
    email: str
    otp_code: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/verify-otp")
async def verify_otp(
    request_body: VerifyOtpRequest,
    pool=Depends(get_db_pool),
) -> dict:
    """Verify OTP and mark user as verified."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Check if OTP is valid
                await cur.execute(
                    """
                    SELECT otp_id FROM otp_verifications
                    WHERE email = %s AND otp_code = %s 
                      AND is_used = FALSE 
                      AND expires_at > NOW()
                    LIMIT 1
                    """,
                    (request_body.email, request_body.otp_code),
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
                    "UPDATE users SET is_verified = TRUE WHERE email = %s",
                    (request_body.email,),
                )
                
                await conn.commit()
        
        return json_response(True, {"email": request_body.email}, "OTP verified successfully")
    except Exception as e:
        return json_response(False, None, f"OTP verification failed: {str(e)}")

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(
    request_body: LoginRequest,
    pool=Depends(get_db_pool),
) -> dict:
    """Login with email and password. Returns access and refresh tokens."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Get user by email
                await cur.execute(
                    """
                    SELECT user_id, email, password_hash, display_name, role, 
                           is_verified, is_suspended
                    FROM users
                    WHERE email = %s
                    """,
                    (request_body.email,),
                )
                user = await cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(request_body.password, user["password_hash"]):
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
    request_body: RefreshTokenRequest,
) -> dict:
    """Issue a new access token using refresh token."""
    try:
        payload = decode_token(request_body.refresh_token)
        
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
