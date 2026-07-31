"""Natal chart caching helper — shared by onboarding / horoscope / tarot / friends."""
from __future__ import annotations

from fastapi import HTTPException

from astrology import chart_summary, compute_natal_chart
from core.db import charts_col
from core.security import now_utc


async def ensure_chart(user: dict) -> dict:
    """Return the cached natal chart doc for `user`, computing + caching on miss.

    Requires the user to have birth_date + birth_time filled in.
    """
    cached = await charts_col.find_one({"user_id": user["id"]}, {"_id": 0})
    if cached:
        return cached
    if not all(user.get(k) for k in ("birth_date", "birth_time")):
        raise HTTPException(400, "Birth data missing")
    chart = compute_natal_chart(
        user["birth_date"], user["birth_time"], user["birth_lat"], user["birth_lng"]
    )
    doc = {
        "user_id": user["id"],
        "chart": chart,
        "summary": chart_summary(chart),
        "created_at": now_utc().isoformat(),
    }
    await charts_col.insert_one(doc)
    doc.pop("_id", None)
    return doc
