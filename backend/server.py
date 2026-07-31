"""Lumina backend — FastAPI app.
Tarot + Astrology API: auth (JWT), natal chart, daily horoscope,
tarot pulls, friends compatibility, journal, Stripe subscriptions."""
from __future__ import annotations

import logging
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load env BEFORE importing modules that read env at import time (llm_service)
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import bcrypt  # noqa: E402
import httpx  # noqa: E402
import jwt  # noqa: E402
import stripe  # noqa: E402
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Request, status  # noqa: E402
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from pydantic import BaseModel, EmailStr, Field  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

from astrology import chart_summary, compute_natal_chart  # noqa: E402
from llm_service import compatibility_reading, daily_horoscope, tarot_interpretation  # noqa: E402
from tarot_data import CARDS_BY_ID, DECK  # noqa: E402

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_PRICE_AMOUNT = int(os.environ.get("STRIPE_PREMIUM_PRICE_AMOUNT", "499"))
STRIPE_CURRENCY = os.environ.get("STRIPE_PREMIUM_CURRENCY", "usd")
APP_URL = os.environ.get("APP_URL", "")

stripe.api_key = STRIPE_API_KEY

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("lumina")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
users_col = db["users"]
sessions_col = db["user_sessions"]
charts_col = db["natal_charts"]
horoscopes_col = db["horoscopes"]
readings_col = db["readings"]
friends_col = db["friends"]
payments_col = db["payments"]

# ---------------------------------------------------------------------------
# FastAPI app + router
# ---------------------------------------------------------------------------
app = FastAPI(title="Lumina API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=24)
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class BirthDataIn(BaseModel):
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    birth_place: str
    birth_lat: float
    birth_lng: float


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


class TarotDrawIn(BaseModel):
    question: str | None = None


class CompatIn(BaseModel):
    friend_id: str


class CheckoutOut(BaseModel):
    url: str
    session_id: str


class SessionExchangeIn(BaseModel):
    session_id: str = Field(min_length=1)


EMERGENT_SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def today_str() -> str:
    return now_utc().date().isoformat()


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except (ValueError, TypeError):
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": now_utc(),
        "exp": now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


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


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing token")
    token = credentials.credentials
    # Try Google session token first (opaque, longer)
    sess = await sessions_col.find_one({"session_token": token}, {"_id": 0})
    if sess:
        exp = sess.get("expires_at")
        if isinstance(exp, str):
            try:
                exp = datetime.fromisoformat(exp)
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
    # Fallback: legacy JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    uid = payload.get("sub")
    user = await users_col.find_one({"id": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/register", response_model=TokenOut)
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


@api.post("/auth/login", response_model=TokenOut)
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
    if not verify_password(body.password, user["password_hash"]):
        fails = user.get("failed_login_count", 0) + 1
        upd: dict[str, Any] = {"failed_login_count": fails}
        if fails >= 5:
            upd["lock_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
            upd["failed_login_count"] = 0
        await users_col.update_one({"id": user["id"]}, {"$set": upd})
        raise HTTPException(401, "Invalid credentials")
    await users_col.update_one(
        {"id": user["id"]}, {"$set": {"failed_login_count": 0, "lock_until": None}}
    )
    return TokenOut(access_token=create_token(user["id"]), user=to_public(user))


@api.get("/auth/me", response_model=UserPublic)
async def me(current=Depends(get_current_user)):
    return to_public(current)


@api.post("/auth/session", response_model=TokenOut)
async def google_session_exchange(body: SessionExchangeIn):
    """Exchange a fresh Emergent OAuth session_id for a 7-day session_token.

    Called by the frontend once, right after the OAuth redirect returns
    with `#session_id=...` in the URL. Never call this with a session_token.
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

    # Upsert user by email (reuse id if exists)
    existing = await users_col.find_one({"email": email}, {"_id": 0})
    if existing:
        uid = existing["id"]
        user = existing
    else:
        uid = f"user_{uuid.uuid4().hex[:12]}"
        # Derive a unique-ish username from email
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

    # Persist the session
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


@api.post("/auth/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if credentials:
        await sessions_col.delete_one({"session_token": credentials.credentials})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Onboarding / natal chart
# ---------------------------------------------------------------------------
async def _ensure_chart(user: dict) -> dict:
    """Compute and cache the natal chart for user if not present."""
    cached = await charts_col.find_one({"user_id": user["id"]}, {"_id": 0})
    if cached:
        return cached
    if not all(user.get(k) for k in ("birth_date", "birth_time")):
        raise HTTPException(400, "Birth data missing")
    chart = compute_natal_chart(
        user["birth_date"], user["birth_time"], user["birth_lat"], user["birth_lng"]
    )
    doc = {"user_id": user["id"], "chart": chart, "summary": chart_summary(chart),
           "created_at": now_utc().isoformat()}
    await charts_col.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/onboarding/birth-data", response_model=UserPublic)
async def save_birth_data(body: BirthDataIn, current=Depends(get_current_user)):
    # Validate by computing chart
    try:
        chart = compute_natal_chart(body.birth_date, body.birth_time, body.birth_lat, body.birth_lng)
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
    # Replace cached chart
    await charts_col.delete_many({"user_id": current["id"]})
    await charts_col.insert_one({
        "user_id": current["id"],
        "chart": chart,
        "summary": chart_summary(chart),
        "created_at": now_utc().isoformat(),
    })
    current.update(upd)
    return to_public(current)


@api.get("/natal-chart")
async def get_natal_chart(current=Depends(get_current_user)):
    if not current.get("onboarded"):
        raise HTTPException(400, "Complete onboarding first")
    doc = await _ensure_chart(current)
    return {"chart": doc["chart"], "summary": doc["summary"]}


# ---------------------------------------------------------------------------
# Daily horoscope
# ---------------------------------------------------------------------------
@api.get("/horoscope/today")
async def horoscope_today(current=Depends(get_current_user)):
    if not current.get("onboarded"):
        raise HTTPException(400, "Complete onboarding first")
    today = today_str()
    existing = await horoscopes_col.find_one(
        {"user_id": current["id"], "date": today}, {"_id": 0}
    )
    if existing:
        return {"date": today, "text": existing["text"], "cached": True}
    chart_doc = await _ensure_chart(current)
    try:
        text = await daily_horoscope(chart_doc["summary"], today)
    except Exception as e:
        logger.exception("horoscope llm error")
        raise HTTPException(503, "Horoscope service temporarily unavailable") from e
    await horoscopes_col.insert_one({
        "user_id": current["id"], "date": today, "text": text,
        "created_at": now_utc().isoformat(),
    })
    return {"date": today, "text": text, "cached": False}


# ---------------------------------------------------------------------------
# Tarot
# ---------------------------------------------------------------------------
@api.get("/tarot/deck")
async def tarot_deck():
    return {"cards": DECK}


@api.get("/tarot/daily")
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
    chart_doc = await _ensure_chart(current)
    keywords = card["keywords_reversed"] if is_reversed else card["keywords_upright"]
    try:
        interpretation = await tarot_interpretation(
            card["name"], keywords, chart_doc["summary"], reversed_=is_reversed
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


@api.post("/tarot/draw")
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
                402, "Free tier: 1 manual draw per day. Upgrade to Premium for unlimited."
            )
    card = random.choice(DECK)
    is_reversed = random.random() < 0.3
    chart_doc = await _ensure_chart(current)
    keywords = card["keywords_reversed"] if is_reversed else card["keywords_upright"]
    try:
        interpretation = await tarot_interpretation(
            card["name"], keywords, chart_doc["summary"], body.question, reversed_=is_reversed
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


# ---------------------------------------------------------------------------
# Journal
# ---------------------------------------------------------------------------
@api.get("/journal")
async def journal(current=Depends(get_current_user), limit: int = 50):
    cursor = readings_col.find({"user_id": current["id"]}, {"_id": 0}).sort(
        "created_at", -1
    ).limit(limit)
    items = await cursor.to_list(length=limit)
    return {"items": items}


# ---------------------------------------------------------------------------
# Friends & Compatibility
# ---------------------------------------------------------------------------
@api.post("/friends/add")
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
    # Idempotent
    exists = await friends_col.find_one(
        {"user_id": current["id"], "friend_id": friend["id"]}
    )
    if exists:
        return {"ok": True, "friend": {"id": friend["id"], "username": friend["username"]}}
    await friends_col.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "friend_id": friend["id"],
        "friend_username": friend["username"],
        "created_at": now_utc().isoformat(),
    })
    return {"ok": True, "friend": {"id": friend["id"], "username": friend["username"]}}


@api.get("/friends")
async def list_friends(current=Depends(get_current_user)):
    cursor = friends_col.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=200)
    # Attach last cached compat score if any
    out = []
    for f in items:
        compat = await db["compat"].find_one(
            {"user_id": current["id"], "friend_id": f["friend_id"]}, {"_id": 0}
        )
        out.append({
            "id": f["friend_id"],
            "username": f["friend_username"],
            "compat_score": compat.get("score") if compat else None,
        })
    return {"items": out}


@api.post("/friends/compatibility")
async def compat(body: CompatIn, current=Depends(get_current_user)):
    friend_link = await friends_col.find_one(
        {"user_id": current["id"], "friend_id": body.friend_id}
    )
    if not friend_link:
        raise HTTPException(404, "Friend not found")
    friend = await users_col.find_one({"id": body.friend_id}, {"_id": 0})
    if not friend:
        raise HTTPException(404, "Friend account missing")
    # Cached?
    cached = await db["compat"].find_one(
        {"user_id": current["id"], "friend_id": body.friend_id}, {"_id": 0}
    )
    if cached:
        return cached
    # Free users see basic teaser; premium full
    user_chart = await _ensure_chart(current)
    friend_chart = await _ensure_chart(friend)
    try:
        result = await compatibility_reading(
            user_chart["summary"], friend_chart["summary"],
            current["username"], friend["username"],
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
    await db["compat"].insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# Stripe subscription (mock-friendly w/ test key)
# ---------------------------------------------------------------------------
@api.post("/stripe/checkout", response_model=CheckoutOut)
async def create_checkout(current=Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{
                "price_data": {
                    "currency": STRIPE_CURRENCY,
                    "product_data": {"name": "Lumina Premium"},
                    "unit_amount": STRIPE_PRICE_AMOUNT,
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }],
            success_url=f"{APP_URL}/paywall-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{APP_URL}/paywall-cancel",
            client_reference_id=current["id"],
            metadata={"lumina_user_id": current["id"]},
        )
    except stripe.error.AuthenticationError:
        logger.exception("stripe auth error")
        raise HTTPException(503, "Payments not configured. Please contact support.")
    except Exception:
        logger.exception("stripe error")
        raise HTTPException(503, "Payment service temporarily unavailable")
    await payments_col.insert_one({
        "user_id": current["id"],
        "session_id": session.id,
        "status": "pending",
        "amount": STRIPE_PRICE_AMOUNT,
        "currency": STRIPE_CURRENCY,
        "created_at": now_utc().isoformat(),
    })
    return CheckoutOut(url=session.url, session_id=session.id)


@api.get("/stripe/session/{session_id}")
async def check_session(session_id: str, current=Depends(get_current_user)):
    """Polled by client after checkout to confirm subscription activation."""
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")
    try:
        sess = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(400, f"Session retrieval failed: {e}")
    payment_status = sess.get("payment_status")
    sub_id = sess.get("subscription")
    # Only the owner can poll
    if sess.get("client_reference_id") and sess["client_reference_id"] != current["id"]:
        raise HTTPException(403, "Not your session")
    if payment_status == "paid":
        await users_col.update_one(
            {"id": current["id"]},
            {"$set": {"is_premium": True, "stripe_subscription_id": sub_id,
                      "premium_since": now_utc().isoformat()}},
        )
        await payments_col.update_one(
            {"session_id": session_id},
            {"$set": {"status": "paid", "subscription_id": sub_id}},
        )
    return {"payment_status": payment_status, "is_premium": payment_status == "paid"}


@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(default=None)):
    """Optional webhook endpoint (not used in preview but ready for prod)."""
    payload = await request.body()
    try:
        event = stripe.Event.construct_from(
            __import__("json").loads(payload.decode()), stripe.api_key
        )
    except Exception as e:
        raise HTTPException(400, f"Bad payload: {e}")
    if event["type"] == "checkout.session.completed":
        sess = event["data"]["object"]
        uid = sess.get("client_reference_id")
        if uid:
            await users_col.update_one(
                {"id": uid},
                {"$set": {"is_premium": True,
                          "stripe_subscription_id": sess.get("subscription"),
                          "premium_since": now_utc().isoformat()}},
            )
    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.updated"):
        sub = event["data"]["object"]
        status_ = sub.get("status")
        sub_id = sub.get("id")
        if status_ in ("canceled", "unpaid", "incomplete_expired"):
            await users_col.update_one(
                {"stripe_subscription_id": sub_id},
                {"$set": {"is_premium": False}},
            )
    return {"received": True}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"status": "ok", "app": "Lumina"}


# ---------------------------------------------------------------------------
# Wiring
# ---------------------------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup_indexes():
    try:
        await users_col.create_index("email", unique=True)
        await users_col.create_index("id", unique=True)
        await users_col.create_index("username", unique=True, sparse=True)
        await sessions_col.create_index("session_token", unique=True)
        await sessions_col.create_index("user_id")
        await sessions_col.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        logger.exception("index creation failed")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
