"""Public bootstrap endpoint.

A cold guest load needs guidebook, active safety alerts and upcoming events.
Fetching them separately is three round trips against a backend that may be
waking from sleep, so they are bundled here.

Nothing in this module requires a token, and nothing in it may return a column
that identifies a resident. Anything user-scoped belongs in its own module
behind get_current_user.
"""

from typing import Any

from fastapi import APIRouter, Depends
from psycopg.rows import dict_row

from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/public", tags=["public"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


@router.get("/bootstrap")
async def get_public_bootstrap(pool=Depends(get_db_pool)) -> dict:
    """Everything a signed-out visitor can see, in one response."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT entry_id, title, content, category, created_at, updated_at
                    FROM guidebook_entries
                    ORDER BY category, created_at
                    """
                )
                guidebook = await cur.fetchall()

                await cur.execute(
                    """
                    SELECT alert_id, NULL::int AS created_by, title, body,
                           severity, is_active, created_at
                    FROM safety_alerts
                    WHERE is_active = TRUE
                    ORDER BY created_at DESC
                    """
                )
                alerts = await cur.fetchall()

                await cur.execute(
                    """
                    SELECT e.event_id, e.title, e.description, e.event_date, e.location,
                           NULL::int AS created_by, e.created_at,
                           COUNT(r.rsvp_id) FILTER (WHERE r.status = 'going') AS attendees,
                           NULL::text AS my_rsvp
                    FROM events e
                    LEFT JOIN event_rsvps r ON e.event_id = r.event_id
                    WHERE e.event_date > NOW()
                    GROUP BY e.event_id
                    ORDER BY e.event_date ASC
                    """
                )
                events = await cur.fetchall()

        return json_response(
            True,
            {"guidebook": guidebook, "safety_alerts": alerts, "events": events},
            "Public content retrieved",
        )
    except Exception:
        # Never surface the database error text: this route is unauthenticated.
        return json_response(False, None, "Failed to retrieve public content")
