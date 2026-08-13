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
    email_verified: bool = False
    language: str = "en"
    birth_date: str | None = None
    birth_time: str | None = None
    birth_place: str | None = None
    birth_lat: float | None = None
    birth_lng: float | None = None


class VerifyEmailIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class ResendCodeIn(BaseModel):
    email: EmailStr


class RegisterResult(BaseModel):
    """Response after registration — user must verify email before receiving a token."""

    email: EmailStr
    verification_required: bool = True
    message: str = "Verification code sent to your email."


class LanguageIn(BaseModel):
    language: str = Field(min_length=2, max_length=8)


class FeedbackIn(BaseModel):
    message: str = Field(min_length=3, max_length=2000)
    category: str = Field(default="other")  # "bug" | "idea" | "other"
    rating: int | None = Field(default=None, ge=1, le=5)


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
        email_verified=u.get("email_verified", False),
        language=u.get("language") or "en",
        birth_date=u.get("birth_date"),
        birth_time=u.get("birth_time"),
        birth_place=u.get("birth_place"),
        birth_lat=u.get("birth_lat"),
        birth_lng=u.get("birth_lng"),
    )
