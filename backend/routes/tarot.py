"""Tarot routes — deck listing, daily pull, manual draw, journal."""
from __future__ import annotations

import logging
import random
import uuid

from fastapi import APIRouter, Depends, HTTPException

from core.db import readings_col
from core.deps import get_current_user
from core.security import now_utc, today_str
from llm_service import tarot_interpretation
from models import TarotDrawIn
from services.charts import ensure_chart
from tarot_data import DECK

logger = logging.getLogger("lumina.tarot")
router = APIRouter(tags=["tarot"])


@router.get("/tarot/deck")
async def tarot_deck():
    return {"cards": DECK}


@router.get("/tarot/daily")
async def tarot_daily(current=Depends(get_current_user)):
    """Get today's daily tarot pull. Auto-draws once per day. Free tier."""
    if not current.get("onboarded"):
        raise HTTPException(400, "Complete onboarding first")
    today = today_str()
    existing = await readings_col.find_one(
        {"user_id": current["id"], "kind": "daily", "date": today}, {"_id": 0}
    )
    if existing:
        return existing
    card = random.choice(DECK)
    is_reversed = random.random() < 0.3
    chart_doc = await ensure_chart(current)
    keywords = card["keywords_reversed"] if is_reversed else card["keywords_upright"]
    try:
        interpretation = await tarot_interpretation(
            card["name"],
            keywords,
            chart_doc["summary"],
            reversed_=is_reversed,
            lang=current.get("language") or "en",
        )
    except Exception as e:
        logger.exception("tarot daily llm error")
        raise HTTPException(503, "Reading service temporarily unavailable") from e
    reading = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "kind": "daily",
        "date": today,
        "card_id": card["id"],
        "card_name": card["name"],
        "reversed": is_reversed,
        "question": None,
        "interpretation": interpretation,
        "created_at": now_utc().isoformat(),
    }
    await readings_col.insert_one(reading)
    reading.pop("_id", None)
    return reading


@router.post("/tarot/draw")
async def tarot_draw(body: TarotDrawIn, current=Depends(get_current_user)):
    """Manual tarot draw. Premium unlocks unlimited; free gets 1 per day total."""
    if not current.get("onboarded"):
        raise HTTPException(400, "Complete onboarding first")
    today = today_str()
    if not current.get("is_premium"):
        manual_today = await readings_col.count_documents(
            {"user_id": current["id"], "kind": "manual", "date": today}
        )
        if manual_today >= 1:
            raise HTTPException(
                402,
                "Free tier: 1 manual draw per day. Upgrade to Premium for unlimited.",
            )
    card = random.choice(DECK)
    is_reversed = random.random() < 0.3
    chart_doc = await ensure_chart(current)
    keywords = card["keywords_reversed"] if is_reversed else card["keywords_upright"]
    try:
        interpretation = await tarot_interpretation(
            card["name"],
            keywords,
            chart_doc["summary"],
            body.question,
            reversed_=is_reversed,
            lang=current.get("language") or "en",
        )
    except Exception as e:
        logger.exception("tarot draw llm error")
        raise HTTPException(503, "Reading service temporarily unavailable") from e
    reading = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "kind": "manual",
        "date": today,
        "card_id": card["id"],
        "card_name": card["name"],
        "reversed": is_reversed,
        "question": body.question,
        "interpretation": interpretation,
        "created_at": now_utc().isoformat(),
    }
    await readings_col.insert_one(reading)
    reading.pop("_id", None)
    return reading


@router.get("/journal")
async def journal(current=Depends(get_current_user), limit: int = 50):
    cursor = (
        readings_col.find({"user_id": current["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    items = await cursor.to_list(length=limit)
    return {"items": items}
