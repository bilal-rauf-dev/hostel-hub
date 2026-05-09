from typing import Any, Optional
from psycopg.rows import dict_row

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel

from auth.dependencies import get_current_user
from database.connection import get_db_pool

router = APIRouter(prefix="/api/v1/marketplace", tags=["marketplace"])


def json_response(success: bool, data: Any = None, message: str = "") -> dict:
    return {"success": success, "data": data, "message": message}


class CreateListingRequest(BaseModel):
    title: str
    description: str
    price: float
    quantity: int
    category: str


class UpdateListingRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None


class PlaceOrderRequest(BaseModel):
    quantity: int


class UpdateOrderStatusRequest(BaseModel):
    status: str


@router.get("/listings")
async def get_listings(
    search: str | None = Query(None),
    category: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get marketplace listings with optional filters."""
    try:
        # Build dynamic WHERE clause
        where_clauses = ["status = 'active'"]
        params = []
        
        if search:
            where_clauses.append("(title ILIKE %s OR description ILIKE %s)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        if category:
            where_clauses.append("category = %s")
            params.append(category)
        
        if min_price is not None:
            where_clauses.append("price >= %s")
            params.append(min_price)
        
        if max_price is not None:
            where_clauses.append("price <= %s")
            params.append(max_price)
        
        where_clause = " AND ".join(where_clauses)
        
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    f"""
                    SELECT ml.listing_id, ml.seller_id, ml.title, ml.description,
                    ml.category, ml.price, ml.status, ml.quantity,
                    ml.created_at, u.display_name AS seller_display_name
                    FROM marketplace_listings ml
                    JOIN users u ON ml.seller_id = u.user_id
                    WHERE {where_clause}
                    ORDER BY ml.created_at DESC
                    """,
                    tuple(params),
                )
                listings = await cur.fetchall()
        
        return json_response(True, listings, "Listings retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve listings: {str(e)}")


@router.post("/listings")
async def create_listing(
    request_body: CreateListingRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Create a new marketplace listing."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    INSERT INTO marketplace_listings
                    (seller_id, title, description, price, quantity, category, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active')
                    RETURNING listing_id
                    """,
                    (
                        user["user_id"],
                        request_body.title,
                        request_body.description,
                        request_body.price,
                        request_body.quantity,
                        request_body.category,
                    ),
                )
                listing = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, {"listing_id": listing["listing_id"]}, "Listing created successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to create listing: {str(e)}")


@router.patch("/listings/{listing_id}")
async def update_listing(
    listing_id: int,
    request_body: UpdateListingRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Update a marketplace listing (seller or admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Check ownership
                await cur.execute(
                    "SELECT seller_id FROM marketplace_listings WHERE listing_id = %s",
                    (listing_id,),
                )
                listing = await cur.fetchone()
                
                if not listing:
                    return json_response(False, None, "Listing not found")
                
                if listing["seller_id"] != user["user_id"] and user["role"] != "admin":
                    raise HTTPException(status_code=403, detail="Not authorized to update this listing")
                
                # Build dynamic update
                updates = []
                params = []
                
                if request_body.title is not None:
                    updates.append("title = %s")
                    params.append(request_body.title)
                if request_body.description is not None:
                    updates.append("description = %s")
                    params.append(request_body.description)
                if request_body.category is not None:
                    updates.append("category = %s")
                    params.append(request_body.category)
                if request_body.price is not None:
                    updates.append("price = %s")
                    params.append(request_body.price)
                if request_body.image_url is not None:
                    updates.append("image_url = %s")
                    params.append(request_body.image_url)
                
                if not updates:
                    return json_response(False, None, "No fields to update")
                
                params.append(listing_id)
                update_clause = ", ".join(updates)
                
                await cur.execute(
                    f"""
                    UPDATE marketplace_listings
                    SET {update_clause}
                    WHERE listing_id = %s
                    RETURNING listing_id, seller_id, title, description, category,
                              price, image_url, status, created_at
                    """,
                    tuple(params),
                )
                updated_listing = await cur.fetchone()
                await conn.commit()
        
        return json_response(True, updated_listing, "Listing updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        return json_response(False, None, f"Failed to update listing: {str(e)}")


@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: int,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Delete a marketplace listing (seller or admin only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Check ownership
                await cur.execute(
                    "SELECT seller_id FROM marketplace_listings WHERE listing_id = %s",
                    (listing_id,),
                )
                listing = await cur.fetchone()
                
                if not listing:
                    return json_response(False, None, "Listing not found")
                
                if listing["seller_id"] != user["user_id"] and user["role"] != "admin":
                    raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
                
                # Mark as removed
                await cur.execute(
                    "UPDATE marketplace_listings SET status = 'removed' WHERE listing_id = %s",
                    (listing_id,),
                )
                await conn.commit()
        
        return json_response(True, {"listing_id": listing_id}, "Listing deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        return json_response(False, None, f"Failed to delete listing: {str(e)}")


@router.post("/listings/{listing_id}/order")
async def place_order(
    listing_id: int,
    request_body: PlaceOrderRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Place an order for a marketplace listing (calls stored procedure)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                # Call stored procedure: SELECT * FROM place_order($1, $2, $3)
                await cur.execute(
                        """
                        SELECT * FROM place_order(
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (listing_id, user["user_id"], request_body.quantity),
                )
                print("Place order params:", listing_id, user["user_id"], request_body.quantity)
                result = await cur.fetchone()
                await conn.commit()

        if result and result.get("order_id"):
            return json_response(True, result, "Order placed successfully")
        else:
            return json_response(False, None, str(result))
    except psycopg.errors.ForeignKeyViolation:
        return json_response(False, None, "Listing not found")
    except Exception as e:
        error_msg = str(e)
        if "self" in error_msg.lower():
            return json_response(False, None, "Cannot order your own item")
        return json_response(False, None, f"Failed to place order: {error_msg}")


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    request_body: UpdateOrderStatusRequest,
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Update order status (seller only)."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT mo.order_id, mo.buyer_id, mo.status, mo.listing_id,
                           ml.title AS item_title, ml.seller_id
                    FROM marketplace_orders mo
                    JOIN marketplace_listings ml ON mo.listing_id = ml.listing_id
                    WHERE mo.order_id = %s
                    """,
                    (order_id,),
                )   
                order = await cur.fetchone()
                
                if not order:
                    return json_response(False, None, "Order not found")
                
                is_seller = order["seller_id"] == user["user_id"]
                is_buyer = order["buyer_id"] == user["user_id"]
                is_admin = user.get("role") == "admin"
                
                allowed_statuses_seller = {"confirmed", "delivered", "cancelled"}
                allowed_statuses_buyer = {"cancelled"}
                
                new_status = request_body.status
                
                if is_admin:
                    pass
                elif is_seller and new_status in allowed_statuses_seller:
                    pass
                elif is_buyer and new_status in allowed_statuses_buyer:
                    pass
                else:
                    raise HTTPException(status_code=403, detail="Not authorized to update this order")
                
                # Update order status
                await cur.execute(
                    """
                    UPDATE marketplace_orders
                    SET status = %s
                    WHERE order_id = %s
                    RETURNING order_id, buyer_id, listing_id, status, created_at
                    """,
                    (request_body.status, order_id),
                )
                updated_order = await cur.fetchone()

                old_status = order["status"]
                item_title = order["item_title"]
                
                notify_user_id = None
                notify_title = None
                notify_body = None
                
                if old_status == "pending" and new_status == "confirmed":
                    notify_user_id = order["buyer_id"]
                    notify_title = "Order Confirmed"
                    notify_body = f"Your order for {item_title} has been confirmed by the seller."
                elif old_status == "confirmed" and new_status == "delivered":
                    notify_user_id = order["buyer_id"]
                    notify_title = "Order Delivered"
                    notify_body = f"Your order for {item_title} has been delivered!"
                elif new_status == "cancelled":
                    if is_seller:
                        notify_user_id = order["buyer_id"]
                        notify_title = "Order Cancelled"
                        notify_body = f"Your order for {item_title} was cancelled by the seller."
                    elif is_buyer:
                        notify_user_id = order["seller_id"]
                        notify_title = "Order Cancelled"
                        notify_body = f"A buyer cancelled their order for {item_title}."
                
                if notify_user_id and notify_title and notify_body:
                    await cur.execute(
                        """
                        INSERT INTO notifications (user_id, title, body, is_read)
                        VALUES (%s, %s, %s, FALSE)
                        """,
                        (notify_user_id, notify_title, notify_body)
                    )

                await conn.commit()
        
        return json_response(True, updated_order, "Order status updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        return json_response(False, None, f"Failed to update order status: {str(e)}")


@router.get("/orders/mine")
async def get_my_orders(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get current user's marketplace orders with complete details."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT mo.order_id, mo.buyer_id, mo.quantity, mo.status, mo.created_at,
                    ml.title AS item_title, ml.price,
                    (mo.quantity * ml.price) AS total_price,
                    u.display_name AS seller_display_name
                    FROM marketplace_orders mo
                    JOIN marketplace_listings ml ON mo.listing_id = ml.listing_id
                    JOIN users u ON ml.seller_id = u.user_id
                    WHERE mo.buyer_id = %s
                    ORDER BY mo.created_at DESC
                    """,
                    (user["user_id"],),
                )
                orders = await cur.fetchall()
        
        return json_response(True, orders, "Orders retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve orders: {str(e)}")

@router.get("/orders/received")
async def get_received_orders(
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
) -> dict:
    """Get orders received by the current user as a seller."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    """
                    SELECT mo.order_id, mo.buyer_id, mo.quantity, mo.status, mo.created_at,
                           ml.title AS item_title, ml.price, ml.listing_id,
                           (mo.quantity * ml.price) AS total_price,
                           u.display_name AS buyer_display_name
                    FROM marketplace_orders mo
                    JOIN marketplace_listings ml ON mo.listing_id = ml.listing_id
                    JOIN users u ON mo.buyer_id = u.user_id
                    WHERE ml.seller_id = %s
                    ORDER BY mo.created_at DESC
                    """,
                    (user["user_id"],),
                )
                orders = await cur.fetchall()
        return json_response(True, orders, "Received orders retrieved successfully")
    except Exception as e:
        return json_response(False, None, f"Failed to retrieve received orders: {str(e)}")