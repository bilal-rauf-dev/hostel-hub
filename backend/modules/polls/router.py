from typing import Any
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_admin
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/polls", tags=["polls"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class CreatePollRequest(BaseModel):
    question: str
    options: list[str]
    deadline: str


class CastVoteRequest(BaseModel):
    option_id: int


@router.get("/")
async def get_polls(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get active polls with options (where deadline > NOW())."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT poll_id, question, deadline, created_at, created_by
                    FROM polls
                    WHERE deadline > NOW()
                    ORDER BY created_at DESC
                    """
                )
                polls = await cur.fetchall()
                
                # Fetch options for each poll
                polls_with_options = []
                for poll in polls:
                    await cur.execute(
                        """
                        SELECT option_id, option_text, display_order
                        FROM poll_options
                        WHERE poll_id = %s
                        ORDER BY display_order ASC
                        """,
                        (poll["poll_id"],),
                    )
                    options = await cur.fetchall()
                    polls_with_options.append({
                        **poll,
                        "options": options
                    })
        
        return json_response(True, polls_with_options, "Polls retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve polls: {str(e)}")


@router.post("/")
async def create_poll(
    request_body: CreatePollRequest,
    admin: dict = Depends(require_admin),
    pool=Depends(get_db_pool),
) -> dict:
    """Create a new poll (admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Insert poll
                await cur.execute(
                    """
                    INSERT INTO polls (question, deadline, created_by)
                    VALUES (%s, %s, %s)
                    RETURNING poll_id, question, deadline, created_at, created_by
                    """,
                    (request_body.question, request_body.deadline, admin["user_id"]),
                )
                poll = await cur.fetchone()
                
                poll_id = poll["poll_id"]
                
                # Insert options
                poll_options = []
                for option_text in request_body.options:
                    await cur.execute(
                        """
                        INSERT INTO poll_options (poll_id, option_text)
                        VALUES (%s, %s)
                        RETURNING option_id, poll_id, option_text
                        """,
                        (poll_id, option_text),
                    )
                    poll_options.append(await cur.fetchone())
                
                await conn.commit()
        
        return json_response(
            True,
            {"poll": poll, "options": poll_options},
            "Poll created successfully"
        )
    except Exception as e:
        return json_response(False, None, f"Failed to create poll: {str(e)}")


@router.post("/{poll_id}/vote")
async def cast_vote(
    poll_id: int,
    request_body: CastVoteRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Cast a vote (calls stored procedure)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Call stored procedure: SELECT * FROM cast_vote($1, $2, $3)
                await cur.execute(
                    """
                    SELECT * FROM cast_vote(
                      %s,
                      %s,
                      %s
                    )
                    """,
                    # function signature: (p_poll_id INT, p_user_id INT, p_option_id INT)
                    (poll_id, user["user_id"], request_body.option_id),
                )
                print("Cast vote params:", poll_id, user["user_id"], request_body.option_id)
                result = await cur.fetchone()
                await conn.commit()
        
        if result and result.get("cast_vote") == "SUCCESS":
            return json_response(True, None, "Vote cast successfully")
        else:
            msg = result.get("cast_vote") if result else "Failed to cast vote"
            return json_response(False, None, msg)
    except psycopg.errors.ForeignKeyViolation:
        return json_response(False, None, "Poll or option not found")
    except Exception as e:
        error_msg = str(e)
        if "duplicate" in error_msg.lower():
            return json_response(False, None, "You have already voted on this poll")
        return json_response(False, None, f"Failed to cast vote: {error_msg}")


@router.get("/{poll_id}/results")
async def get_poll_results(
    poll_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get poll results with percentages."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Get poll options
                await cur.execute(
                    """
                    SELECT option_id, option_text
                    FROM poll_options
                    WHERE poll_id = %s
                    """,
                    (poll_id,),
                )
                options = await cur.fetchall()
                
                results = []
                for option in options:
                    # Call function for each option: SELECT get_poll_percentage($1, $2)
                    await cur.execute(
                        """
                        SELECT get_poll_percentage(%s, %s) as percentage
                        """,
                        (poll_id, option["option_id"]),
                    )
                    percentage_row = await cur.fetchone()
                    
                    # Get vote count
                    await cur.execute(
                        """
                        SELECT COUNT(*) as vote_count
                        FROM poll_votes
                        WHERE option_id = %s
                        """,
                        (option["option_id"],),
                    )
                    vote_count_row = await cur.fetchone()
                    
                    results.append({
                        "option_id": option["option_id"],
                        "option_text": option["option_text"],
                        "percentage": percentage_row["percentage"],
                        "vote_count": vote_count_row["vote_count"] or 0
                    })
        
        return json_response(True, results, "Poll results retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve poll results: {str(e)}")
