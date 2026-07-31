"""Onboarding, natal chart and daily horoscope routes."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from astrology import chart_summary, compute_natal_chart
from core.db import charts_col, horoscopes_col, users_col
from core.deps import get_current_user
from core.security import now_utc, today_str
from llm_service import daily_horoscope
from models import BirthDataIn, UserPublic, to_public
from services.charts import ensure_chart

logger = logging.getLogger("lumina.onboarding")
router = APIRouter(tags=["onboarding"])


@router.post("/onboarding/birth-data", response_model=UserPublic)
async def save_birth_data(body: BirthDataIn, current=Depends(get_current_user)):
    try:
        chart = compute_natal_chart(
            body.birth_date, body.birth_time, body.birth_lat, body.birth_lng
        )
    except Exception as e:
        logger.exception("natal chart error")
        raise HTTPException(400, f"Invalid birth data: {e}")
    upd = {
        "birth_date": body.birth_date,
        "birth_time": body.birth_time,
        "birth_place": body.birth_place,
        "birth_lat": body.birth_lat,
        "birth_lng": body.birth_lng,
        "onboarded": True,
    }
    await users_col.update_one({"id": current["id"]}, {"$set": upd})
    await charts_col.delete_many({"user_id": current["id"]})
    await charts_col.insert_one(
        {
            "user_id": current["id"],
            "chart": chart,
            "summary": chart_summary(chart),
            "created_at": now_utc().isoformat(),
        }
    )
    current.update(upd)
    return to_public(current)


@router.get("/natal-chart")
async def get_natal_chart(current=Depends(get_current_user)):
    if not current.get("onboarded"):
        raise HTTPException(400, "Complete onboarding first")
    doc = await ensure_chart(current)
    return {"chart": doc["chart"], "summary": doc["summary"]}


@router.get("/horoscope/today")
async def horoscope_today(current=Depends(get_current_user)):
    if not current.get("onboarded"):
        raise HTTPException(400, "Complete onboarding first")
    today = today_str()
    existing = await horoscopes_col.find_one(
        {"user_id": current["id"], "date": today}, {"_id": 0}
    )
    if existing:
        return {"date": today, "text": existing["text"], "cached": True}
    chart_doc = await ensure_chart(current)
    try:
        text = await daily_horoscope(
            chart_doc["summary"], today, lang=current.get("language") or "en"
        )
    except Exception as e:
        logger.exception("horoscope llm error")
        raise HTTPException(503, "Horoscope service temporarily unavailable") from e
    await horoscopes_col.insert_one(
        {
            "user_id": current["id"],
            "date": today,
            "text": text,
            "created_at": now_utc().isoformat(),
        }
    )
    return {"date": today, "text": text, "cached": False}
