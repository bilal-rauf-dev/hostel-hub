from typing import Any, Optional
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/events", tags=["events"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class CreateEventRequest(BaseModel):
    title: str
    description: str
    location: str
    event_date: str
    image_url: Optional[str] = None


class RSVPEventRequest(BaseModel):
    status: str


@router.get("/")
async def get_events(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get upcoming events (where event_date > NOW())."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                """
                SELECT e.event_id, e.title, e.description, e.event_date, e.location, 
                    e.created_by, e.created_at,
                    COUNT(r.rsvp_id) FILTER (WHERE r.status = 'going') AS attendees,
                    MAX(CASE WHEN r.user_id = %s THEN r.status END) AS my_rsvp
                FROM events e
                LEFT JOIN event_rsvps r ON e.event_id = r.event_id
                WHERE e.event_date > NOW()
                GROUP BY e.event_id
                ORDER BY e.event_date ASC
                """,
                (user["user_id"],),
                )
                events = await cur.fetchall()
        
        return json_response(True, events, "Events retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve events: {str(e)}")


@router.post("/")
async def create_event(
    request_body: CreateEventRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Create a new event (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO events (title, description, location, event_date, image_url, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING event_id, title, description, location, event_date, image_url, created_by, created_at
                    """,
                    (
                        request_body.title,
                        request_body.description,
                        request_body.location,
                        request_body.event_date,
                        request_body.image_url,
                        admin["user_id"],
                    ),
                )
                event = await cur.fetchone()
                
                if event:
                    await cur.execute(
                        """
                        INSERT INTO notifications (user_id, title, body)
                        SELECT user_id, %s, %s
                        FROM users
                        WHERE role = 'student'
                        """,
                        (
                            f"New Event: {request_body.title}",
                            f"{request_body.title} on {request_body.event_date} at {request_body.location}"
                        )
                    )
                
                await conn.commit()
        
        return json_response(True, event, "Event created successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to create event: {str(e)}")


@router.post("/{event_id}/rsvp")
async def rsvp_event(
    event_id: int,
    request_body: RSVPEventRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """RSVP to an event (insert or update on conflict)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO event_rsvps (event_id, user_id, status)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (event_id, user_id) DO UPDATE SET status = %s
                    RETURNING rsvp_id, event_id, user_id, status
                    """,
                    (event_id, user["user_id"], request_body.status, request_body.status),
                )
                rsvp = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, rsvp, "RSVP updated successfully")
    except psycopg.errors.ForeignKeyViolation:
        return json_response(False, None, "Event not found")
    except Exception as e:
        return json_response(False, None, f"Failed to RSVP: {str(e)}")


@router.get("/{event_id}/rsvps")
async def get_event_rsvps(
    event_id: int,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Get RSVP statistics for an event (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT status, COUNT(*) as count
                    FROM event_rsvps
                    WHERE event_id = %s
                    GROUP BY status
                    """,
                    (event_id,),
                )
                rsvp_stats = await cur.fetchall()
        
        return json_response(True, rsvp_stats, "RSVP statistics retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve RSVP statistics: {str(e)}")
