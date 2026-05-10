from typing import Any
from psycopg.rows import dict_row

import psycopg
from psycopg.rows import dict_row
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/maintenance", tags=["maintenance"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class CreateTicketRequest(BaseModel):
    description: str
    category: str
    room_number: str


class UpdateTicketStatusRequest(BaseModel):
    status: str


class AssignTicketRequest(BaseModel):
    assigned_to: int


@router.post("/tickets")
async def create_ticket(
    request_body: CreateTicketRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Create a new maintenance ticket."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO maintenance_tickets
                    (student_id, description, category, room_number, status)
                    VALUES (%s, %s, %s, %s, 'submitted')
                    RETURNING ticket_id, student_id, description, category,
                    room_number, status, created_at
                    """,
                    (
                        user["user_id"],
                        request_body.description,
                        request_body.category,
                        request_body.room_number,
                    ),
                )
                ticket = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, ticket, "Ticket created successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to create ticket: {str(e)}")


@router.get("/tickets")
async def get_tickets(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get maintenance tickets (role-aware: students see only their own, admins see all)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                if user["role"] == "student":
                    # Students see only their own tickets
                    await cur.execute(
                        """
                        SELECT mt.ticket_id, mt.student_id, mt.description,
                               mt.category, mt.room_number, mt.status,
                               mt.assigned_to, mt.created_at, mt.updated_at,
                               u.display_name as student_name, u.room_number as student_room
                        FROM maintenance_tickets mt
                        JOIN users u ON mt.student_id = u.user_id
                        WHERE mt.student_id = %s
                        ORDER BY mt.created_at DESC
                        """,
                        (user["user_id"],),
                    )
                else:
                    # Admins see all tickets
                    await cur.execute(
                        """
                        SELECT mt.ticket_id, mt.student_id, mt.description,
                               mt.category, mt.room_number, mt.status,
                               mt.assigned_to, mt.created_at, mt.updated_at,
                               u.display_name as student_name, u.room_number as student_room
                        FROM maintenance_tickets mt
                        JOIN users u ON mt.student_id = u.user_id
                        ORDER BY mt.created_at DESC
                        """
                    )
                tickets = await cur.fetchall()
        
        return json_response(True, tickets, "Tickets retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve tickets: {str(e)}")

@router.get("/tickets/all")
async def get_all_tickets(
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Get all maintenance tickets (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT mt.ticket_id, mt.description, mt.category, mt.room_number,
                           mt.status, mt.created_at, mt.assigned_to,
                           u.display_name AS student_name
                    FROM maintenance_tickets mt
                    LEFT JOIN users u ON mt.student_id = u.user_id
                    ORDER BY mt.created_at DESC
                    """
                )
                tickets = await cur.fetchall()
        return json_response(True, tickets, "All tickets retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve tickets: {str(e)}")

@router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: int,
    request_body: UpdateTicketStatusRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:  # no dict_row here
                await cur.execute(
                    "SELECT update_ticket_status(%s, %s::ticket_status, %s)",
                    (ticket_id, request_body.status, admin["user_id"]),
                )
                result = await cur.fetchone()
                await conn.commit()

        msg = result[0] if result else "Unknown error"
        if msg == "SUCCESS":
            return json_response(True, {"ticket_id": ticket_id, "status": request_body.status}, "Ticket status updated successfully")
        else:
            return json_response(False, None, msg)
    except Exception as e:
        return json_response(False, None, f"Failed to update ticket status: {str(e)}")


@router.patch("/tickets/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: int,
    request_body: AssignTicketRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Assign ticket to staff member (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Check if staff user exists
                await cur.execute(
                    "SELECT user_id FROM users WHERE user_id = %s AND role = 'admin'",
                    (request_body.assigned_to,),
                )
                staff = await cur.fetchone()
                
                if not staff:
                    return json_response(False, None, "Staff member not found")
                
                # Assign ticket
                await cur.execute(
                    """
                    UPDATE maintenance_tickets
                    SET assigned_to = %s
                    WHERE ticket_id = %s
                    RETURNING ticket_id, student_id, description, category,
                    room_number, status, assigned_to, created_at
                    """,
                    (request_body.assigned_to, ticket_id),
                )
                ticket = await cur.fetchone()
                await conn.commit()
        
        if ticket:
            return json_response(True, ticket, "Ticket assigned successfully")
        else:
            return json_response(False, None, "Ticket not found")
    except Exception as e:
        return json_response(False, None, f"Failed to assign ticket: {str(e)}")

@router.delete("/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Delete a maintenance ticket (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    "DELETE FROM maintenance_tickets WHERE ticket_id = %s RETURNING ticket_id",
                    (ticket_id,),
                )
                result = await cur.fetchone()
                await conn.commit()

        if not result:
            return json_response(False, None, "Ticket not found")
        return json_response(True, None, "Ticket deleted successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to delete ticket: {str(e)}")