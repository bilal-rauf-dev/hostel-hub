from typing import Any
from psycopg.rows import dict_row

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/community", tags=["community"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class CreatePostRequest(BaseModel):
    content: str


@router.get("/posts")
async def get_posts(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT cp.post_id, cp.content, cp.created_at,
                           cp.user_id,
                           u.display_name AS author_name,
                           COUNT(pl.like_id) AS like_count,
                           BOOL_OR(pl.user_id = %s) AS liked_by_me
                    FROM community_posts cp
                    JOIN users u ON cp.user_id = u.user_id
                    LEFT JOIN post_likes pl ON cp.post_id = pl.post_id
                    GROUP BY cp.post_id, cp.content, cp.created_at, cp.user_id, u.display_name
                    ORDER BY cp.created_at DESC
                    """,
                    (user["user_id"],),
                )
                posts = await cur.fetchall()
        return json_response(True, posts, "Posts retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve posts: {str(e)}")


@router.post("/posts")
async def create_post(
    request_body: CreatePostRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO community_posts (user_id, content)
                    VALUES (%s, %s)
                    RETURNING post_id, user_id, content, created_at
                    """,
                    (user["user_id"], request_body.content),
                )
                post = await cur.fetchone()
                await conn.commit()
        return json_response(True, post, "Post created successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to create post: {str(e)}")


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    "SELECT user_id FROM community_posts WHERE post_id = %s",
                    (post_id,),
                )
                post = await cur.fetchone()
                if not post:
                    return json_response(False, None, "Post not found")
                if post["user_id"] != user["user_id"] and user["role"] != "admin":
                    return json_response(False, None, "Not authorized")
                
                await cur.execute(
                    "DELETE FROM community_posts WHERE post_id = %s",
                    (post_id,),
                )
                
                if post["user_id"] != user["user_id"] and user["role"] == "admin":
                    await cur.execute(
                        """
                        INSERT INTO notifications (user_id, title, body)
                        VALUES (%s, %s, %s)
                        """,
                        (post["user_id"], "Your post was removed", "Your post was removed by an admin.")
                    )
                
                await conn.commit()
        return json_response(True, None, "Post deleted successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to delete post: {str(e)}")


@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Check if already liked
                await cur.execute(
                    "SELECT like_id FROM post_likes WHERE post_id = %s AND user_id = %s",
                    (post_id, user["user_id"]),
                )
                existing = await cur.fetchone()
                if existing:
                    await cur.execute(
                        "DELETE FROM post_likes WHERE post_id = %s AND user_id = %s",
                        (post_id, user["user_id"]),
                    )
                    action = "unliked"
                else:
                    await cur.execute(
                        "INSERT INTO post_likes (post_id, user_id) VALUES (%s, %s)",
                        (post_id, user["user_id"]),
                    )
                    action = "liked"
                    
                    # Notify post author
                    await cur.execute(
                        "SELECT user_id FROM community_posts WHERE post_id = %s",
                        (post_id,)
                    )
                    post_author = await cur.fetchone()
                    if post_author and post_author["user_id"] != user["user_id"]:
                        await cur.execute(
                            "SELECT display_name FROM users WHERE user_id = %s",
                            (user["user_id"],)
                        )
                        liker = await cur.fetchone()
                        liker_name = liker["display_name"] if liker else "Someone"
                        
                        await cur.execute(
                            """
                            INSERT INTO notifications (user_id, title, body)
                            VALUES (%s, %s, %s)
                            """,
                            (post_author["user_id"], "Someone liked your post", f"{liker_name} liked your post")
                        )

                await conn.commit()
        return json_response(True, {"action": action}, f"Post {action} successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to toggle like: {str(e)}")