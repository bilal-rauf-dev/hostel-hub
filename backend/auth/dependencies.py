from typing import Any
from psycopg.rows import dict_row

from psycopg.rows import dict_row

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.utils import decode_token
from database.connection import get_db_pool

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    pool=Depends(get_db_pool),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub") or payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token payload") from exc

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT user_id, email, student_id, display_name, profile_picture,
                       contact_number, room_number, role, is_verified, is_suspended,
                       password_hash, fcm_token, created_at
                FROM users
                WHERE user_id = %s
                """,
                (user_id_int,),
            )
            user = await cur.fetchone()

    if user is None or user.get("is_suspended"):
        raise HTTPException(status_code=401, detail="User not authorized")

    return user


async def require_admin(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
