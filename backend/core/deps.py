"""FastAPI dependencies — authentication (JWT + Google session_token)."""
from __future__ import annotations

from datetime import timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .db import sessions_col, users_col
from .security import decode_token, now_utc

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing token")
    token = credentials.credentials

    # 1) Try opaque Google session_token (looked up in user_sessions)
    sess = await sessions_col.find_one({"session_token": token}, {"_id": 0})
    if sess:
        exp = sess.get("expires_at")
        if isinstance(exp, str):
            try:
                from datetime import datetime as _dt

                exp = _dt.fromisoformat(exp)
            except (ValueError, TypeError):
                exp = None
        if exp is not None:
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now_utc():
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")
        user = await users_col.find_one({"id": sess["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
        return user

    # 2) Fallback: legacy JWT
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    uid = payload.get("sub")
    user = await users_col.find_one({"id": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user
