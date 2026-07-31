"""Authentication routes — email/password JWT + Emergent Google OAuth."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from core.config import EMERGENT_SESSION_DATA_URL
from core.db import sessions_col, users_col
from core.deps import get_current_user, security
from core.security import (
    create_token,
    hash_password,
    now_utc,
    verify_password,
)
from models import (
    LoginIn,
    RegisterIn,
    SessionExchangeIn,
    TokenOut,
    UserPublic,
    to_public,
)

logger = logging.getLogger("lumina.auth")
router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    email = body.email.lower()
    uname = body.username.lower()
    if await users_col.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    if await users_col.find_one({"username": uname}):
        raise HTTPException(400, "Username taken")
    uid = str(uuid.uuid4())
    user = {
        "id": uid,
        "email": email,
        "username": uname,
        "password_hash": hash_password(body.password),
        "is_premium": False,
        "onboarded": False,
        "failed_login_count": 0,
        "lock_until": None,
        "created_at": now_utc().isoformat(),
    }
    await users_col.insert_one(user)
    user.pop("_id", None)
    return TokenOut(access_token=create_token(uid), user=to_public(user))


@router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    email = body.email.lower()
    user = await users_col.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Invalid credentials")

    lock_until = user.get("lock_until")
    if lock_until:
        try:
            lu = datetime.fromisoformat(lock_until)
            if lu > now_utc():
                raise HTTPException(403, "Account temporarily locked")
        except (ValueError, TypeError):
            pass

    if not user.get("password_hash") or not verify_password(
        body.password, user["password_hash"]
    ):
        fails = user.get("failed_login_count", 0) + 1
        upd: dict[str, Any] = {"failed_login_count": fails}
        if fails >= 5:
            upd["lock_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
            upd["failed_login_count"] = 0
        await users_col.update_one({"id": user["id"]}, {"$set": upd})
        raise HTTPException(401, "Invalid credentials")

    await users_col.update_one(
        {"id": user["id"]},
        {"$set": {"failed_login_count": 0, "lock_until": None}},
    )
    return TokenOut(access_token=create_token(user["id"]), user=to_public(user))


@router.get("/auth/me", response_model=UserPublic)
async def me(current=Depends(get_current_user)):
    return to_public(current)


@router.post("/auth/session", response_model=TokenOut)
async def google_session_exchange(body: SessionExchangeIn):
    """Exchange a fresh Emergent OAuth `session_id` for a 7-day `session_token`.

    Only called by the frontend once, right after the OAuth redirect returns
    with `#session_id=...` in the URL. Never call this with a `session_token`.
    """
    sid = body.session_id.strip()
    if not sid:
        raise HTTPException(400, "Missing session_id")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client_http:
            resp = await client_http.get(
                EMERGENT_SESSION_DATA_URL,
                headers={"X-Session-ID": sid},
            )
    except httpx.HTTPError as e:
        logger.exception("emergent oauth network error")
        raise HTTPException(503, "Auth provider unavailable") from e
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid or expired session_id")
    data = resp.json() or {}
    email = (data.get("email") or "").lower().strip()
    session_token = data.get("session_token")
    name = data.get("name") or ""
    if not email or not session_token:
        raise HTTPException(401, "Malformed session data")

    existing = await users_col.find_one({"email": email}, {"_id": 0})
    if existing:
        uid = existing["id"]
        user = existing
    else:
        uid = f"user_{uuid.uuid4().hex[:12]}"
        base = email.split("@", 1)[0].lower()
        base = "".join(c for c in base if c.isalnum() or c == "_")[:20] or "seeker"
        uname = base
        suffix = 0
        while await users_col.find_one({"username": uname}):
            suffix += 1
            uname = f"{base}{suffix}"
        user = {
            "id": uid,
            "email": email,
            "username": uname,
            "name": name,
            "auth_provider": "google",
            "password_hash": None,
            "is_premium": False,
            "onboarded": False,
            "failed_login_count": 0,
            "lock_until": None,
            "created_at": now_utc().isoformat(),
        }
        await users_col.insert_one(user)
        user.pop("_id", None)

    expires_at = now_utc() + timedelta(days=7)
    await sessions_col.update_one(
        {"session_token": session_token},
        {
            "$set": {
                "session_token": session_token,
                "user_id": uid,
                "expires_at": expires_at,
                "created_at": now_utc(),
            }
        },
        upsert=True,
    )
    return TokenOut(access_token=session_token, user=to_public(user))


@router.post("/auth/logout", status_code=status.HTTP_200_OK)
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    """Best-effort logout — deletes the session row if the bearer is a Google
    session_token. Legacy JWTs are stateless, so this is a no-op for them."""
    if credentials:
        await sessions_col.delete_one({"session_token": credentials.credentials})
    return {"ok": True}
