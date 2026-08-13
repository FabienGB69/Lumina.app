"""Mongo client + collection handles. Single source of truth."""
from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from .config import DB_NAME, MONGO_URL

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

users_col = db["users"]
sessions_col = db["user_sessions"]
charts_col = db["natal_charts"]
horoscopes_col = db["horoscopes"]
readings_col = db["readings"]
friends_col = db["friends"]
payments_col = db["payments"]
compat_col = db["compat"]
feedback_col = db["feedback"]


async def ensure_indexes() -> None:
    """Idempotent index creation, called on FastAPI startup."""
    await users_col.create_index("email", unique=True)
    await users_col.create_index("id", unique=True)
    await users_col.create_index("username", unique=True, sparse=True)
    await sessions_col.create_index("session_token", unique=True)
    await sessions_col.create_index("user_id")
    await sessions_col.create_index("expires_at", expireAfterSeconds=0)
