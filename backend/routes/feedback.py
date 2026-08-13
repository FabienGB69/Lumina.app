"""Feedback route — collects user feedback in a Mongo collection."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends

from core.db import feedback_col
from core.deps import get_current_user
from core.security import now_utc
from models import FeedbackIn

VALID_CATEGORIES = {"bug", "idea", "other"}

logger = logging.getLogger("lumina.feedback")
router = APIRouter(tags=["feedback"])


@router.post("/feedback")
async def submit_feedback(body: FeedbackIn, current=Depends(get_current_user)):
    category = body.category.lower().strip()
    if category not in VALID_CATEGORIES:
        category = "other"
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "user_email": current.get("email"),
        "username": current.get("username"),
        "language": current.get("language") or "en",
        "category": category,
        "rating": body.rating,
        "message": body.message.strip(),
        "created_at": now_utc().isoformat(),
    }
    await feedback_col.insert_one(doc)
    doc.pop("_id", None)
    logger.info(
        "feedback received uid=%s cat=%s rating=%s",
        current["id"],
        category,
        body.rating,
    )
    return {"ok": True, "id": doc["id"]}
