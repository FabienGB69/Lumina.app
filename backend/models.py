"""Pydantic request/response models — shared across route modules."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---------------------------------------------------------------


class RegisterIn(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=24)
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class SessionExchangeIn(BaseModel):
    session_id: str = Field(min_length=1)


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    username: str
    is_premium: bool = False
    onboarded: bool = False
    birth_date: str | None = None
    birth_time: str | None = None
    birth_place: str | None = None
    birth_lat: float | None = None
    birth_lng: float | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserPublic


# --- Onboarding / astrology --------------------------------------------


class BirthDataIn(BaseModel):
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    birth_place: str
    birth_lat: float
    birth_lng: float


# --- Tarot --------------------------------------------------------------


class TarotDrawIn(BaseModel):
    question: str | None = None


# --- Friends ------------------------------------------------------------


class CompatIn(BaseModel):
    friend_id: str


# --- Stripe -------------------------------------------------------------


class CheckoutOut(BaseModel):
    url: str
    session_id: str


# --- Helpers ------------------------------------------------------------


def to_public(u: dict) -> UserPublic:
    return UserPublic(
        id=u["id"],
        email=u["email"],
        username=u["username"],
        is_premium=u.get("is_premium", False),
        onboarded=u.get("onboarded", False),
        birth_date=u.get("birth_date"),
        birth_time=u.get("birth_time"),
        birth_place=u.get("birth_place"),
        birth_lat=u.get("birth_lat"),
        birth_lng=u.get("birth_lng"),
    )
