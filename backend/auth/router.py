from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/health")
async def auth_health() -> dict:
    return {"success": True, "data": None, "message": "module online"}
