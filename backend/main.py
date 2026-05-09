from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.router import router as auth_router
from core.config import settings
from database.connection import close_db_pool, init_db_pool
from modules.events.router import router as events_router
from modules.guidebook.router import router as guidebook_router
from modules.lost_found.router import router as lost_found_router
from modules.maintenance.router import router as maintenance_router
from modules.marketplace.router import router as marketplace_router
from modules.notifications.router import router as notifications_router
from modules.polls.router import router as polls_router
from modules.users.router import router as users_router
from modules.safety_alerts.router import router as safety_alerts_router
from modules.community import router as community_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool(app)
    try:
        yield
    finally:
        await close_db_pool(app)


app = FastAPI(title="Hostel-Hub API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(marketplace_router)
app.include_router(maintenance_router)
app.include_router(polls_router)
app.include_router(events_router)
app.include_router(lost_found_router)
app.include_router(guidebook_router)
app.include_router(notifications_router)
app.include_router(safety_alerts_router)
app.include_router(community_router.router)


@app.get("/health")
async def health_check() -> dict:
    return {"success": True, "data": {"service": "hostel-hub-api"}, "message": "ok"}
