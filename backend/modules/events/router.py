from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("/")
async def module_health() -> dict:
    return {"success": True, "data": None, "message": "module online"}
