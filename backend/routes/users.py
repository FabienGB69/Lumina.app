"""User preferences — language, etc."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from core.db import horoscopes_col, users_col
from core.deps import get_current_user
from models import LanguageIn, UserPublic, to_public

SUPPORTED_LANGS = {"en", "fr"}

logger = logging.getLogger("lumina.users")
router = APIRouter(tags=["users"])


@router.put("/users/language", response_model=UserPublic)
async def set_language(body: LanguageIn, current=Depends(get_current_user)):
    lang = body.language.lower().strip()[:8]
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(400, f"Unsupported language: {lang}")
    await users_col.update_one({"id": current["id"]}, {"$set": {"language": lang}})
    # Invalidate today's cached horoscope so the next fetch is regenerated
    # in the newly-chosen language instead of returning the old cached text.
    await horoscopes_col.delete_many({"user_id": current["id"]})
    current["language"] = lang
    return to_public(current)
