"""Friends CRUD + compatibility reading routes."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException

from core.db import compat_col, friends_col, users_col
from core.deps import get_current_user
from core.security import now_utc
from llm_service import compatibility_reading
from models import CompatIn
from services.charts import ensure_chart

logger = logging.getLogger("lumina.friends")
router = APIRouter(tags=["friends"])


@router.post("/friends/add")
async def add_friend(payload: dict, current=Depends(get_current_user)):
    uname = (payload.get("username") or "").lower().strip()
    if not uname:
        raise HTTPException(400, "Username required")
    if uname == current["username"]:
        raise HTTPException(400, "Cannot add yourself")
    friend = await users_col.find_one({"username": uname}, {"_id": 0})
    if not friend:
        raise HTTPException(404, "User not found")
    if not friend.get("onboarded"):
        raise HTTPException(400, "User hasn't completed onboarding")
    exists = await friends_col.find_one(
        {"user_id": current["id"], "friend_id": friend["id"]}
    )
    if exists:
        return {"ok": True, "friend": {"id": friend["id"], "username": friend["username"]}}
    await friends_col.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": current["id"],
            "friend_id": friend["id"],
            "friend_username": friend["username"],
            "created_at": now_utc().isoformat(),
        }
    )
    return {"ok": True, "friend": {"id": friend["id"], "username": friend["username"]}}


@router.get("/friends")
async def list_friends(current=Depends(get_current_user)):
    cursor = friends_col.find({"user_id": current["id"]}, {"_id": 0}).sort(
        "created_at", -1
    )
    items = await cursor.to_list(length=200)
    out = []
    for f in items:
        compat = await compat_col.find_one(
            {"user_id": current["id"], "friend_id": f["friend_id"]}, {"_id": 0}
        )
        out.append(
            {
                "id": f["friend_id"],
                "username": f["friend_username"],
                "compat_score": compat.get("score") if compat else None,
            }
        )
    return {"items": out}


@router.post("/friends/compatibility")
async def compatibility(body: CompatIn, current=Depends(get_current_user)):
    friend_link = await friends_col.find_one(
        {"user_id": current["id"], "friend_id": body.friend_id}
    )
    if not friend_link:
        raise HTTPException(404, "Friend not found")
    friend = await users_col.find_one({"id": body.friend_id}, {"_id": 0})
    if not friend:
        raise HTTPException(404, "Friend account missing")
    cached = await compat_col.find_one(
        {"user_id": current["id"], "friend_id": body.friend_id}, {"_id": 0}
    )
    if cached:
        return cached
    user_chart = await ensure_chart(current)
    friend_chart = await ensure_chart(friend)
    try:
        result = await compatibility_reading(
            user_chart["summary"],
            friend_chart["summary"],
            current["username"],
            friend["username"],
            lang=current.get("language") or "en",
        )
    except Exception as e:
        logger.exception("compat llm error")
        raise HTTPException(503, "Compatibility service temporarily unavailable") from e
    doc = {
        "user_id": current["id"],
        "friend_id": body.friend_id,
        "friend_username": friend["username"],
        "score": result["score"],
        "reading": result["reading"],
        "created_at": now_utc().isoformat(),
    }
    await compat_col.insert_one(doc)
    doc.pop("_id", None)
    return doc
