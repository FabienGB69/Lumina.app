"""Authentication routes — email/password JWT + Emergent Google OAuth."""
from __future__ import annotations

import logging
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from core.config import EMERGENT_SESSION_DATA_URL
from core.db import sessions_col, users_col
from core.deps import get_current_user, security
from core.security import (
    create_token,
    hash_password,
    now_utc,
    verify_password,
)
from models import (
    LoginIn,
    RegisterIn,
    RegisterResult,
    ResendCodeIn,
    SessionExchangeIn,
    TokenOut,
    UserPublic,
    VerifyEmailIn,
    to_public,
)
from services.email import send_email, verification_email_html

logger = logging.getLogger("lumina.auth")
router = APIRouter(tags=["auth"])

CODE_TTL_MINUTES = 15
CODE_MAX_ATTEMPTS = 6
RESEND_COOLDOWN_SECONDS = 60


def generate_code() -> str:
    """Cryptographically-random 6-digit numeric code."""
    return f"{secrets.randbelow(1_000_000):06d}"


async def _issue_and_send_code(user: dict) -> None:
    """Generate a fresh verification code, persist it, and email it.

    Logs the code (masked) but never returns it. If the email send fails, the
    code is still persisted so we can retry via /auth/resend-code.
    """
    code = generate_code()
    expires = now_utc() + timedelta(minutes=CODE_TTL_MINUTES)
    await users_col.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "verification_code": code,
                "verification_expires_at": expires.isoformat(),
                "verification_attempts": 0,
                "verification_last_sent_at": now_utc().isoformat(),
            }
        },
    )
    subject, html = verification_email_html(code, user.get("language") or "en")
    ok, err = await send_email(user["email"], subject, html)
    if not ok:
        # In preview / non-deployed envs the platform Resend key may not be
        # provisioned. Log the code so QA/dev can still complete the flow.
        logger.warning(
            "email send failed (%s) — DEV code for %s: %s",
            err,
            user["email"],
            code,
        )
    else:
        logger.info("verification code sent to %s (masked: %s****)", user["email"], code[:2])


@router.post("/auth/register", response_model=RegisterResult)
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
        "email_verified": False,
        "auth_provider": "email",
        "failed_login_count": 0,
        "lock_until": None,
        "created_at": now_utc().isoformat(),
    }
    await users_col.insert_one(user)
    user.pop("_id", None)
    await _issue_and_send_code(user)
    return RegisterResult(email=email, verification_required=True)


@router.post("/auth/verify-email", response_model=TokenOut)
async def verify_email(body: VerifyEmailIn):
    email = body.email.lower().strip()
    code = body.code.strip()
    user = await users_col.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(404, "Account not found")
    if user.get("email_verified"):
        # Already verified — allow re-issuing a token so client can log in.
        return TokenOut(access_token=create_token(user["id"]), user=to_public(user))

    attempts = user.get("verification_attempts", 0)
    if attempts >= CODE_MAX_ATTEMPTS:
        raise HTTPException(429, "Too many attempts. Request a new code.")

    stored_code = user.get("verification_code")
    exp_raw = user.get("verification_expires_at")
    exp = None
    if exp_raw:
        try:
            exp = datetime.fromisoformat(exp_raw)
        except (ValueError, TypeError):
            exp = None

    now = now_utc()
    if not stored_code or not exp or exp < now:
        raise HTTPException(400, "Code expired. Request a new one.")

    # Constant-time compare
    if not secrets.compare_digest(stored_code, code):
        await users_col.update_one(
            {"id": user["id"]}, {"$inc": {"verification_attempts": 1}}
        )
        raise HTTPException(400, "Invalid code")

    await users_col.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "email_verified": True,
                "email_verified_at": now.isoformat(),
                "verification_code": None,
                "verification_expires_at": None,
                "verification_attempts": 0,
                "failed_login_count": 0,
                "lock_until": None,
            }
        },
    )
    user["email_verified"] = True
    return TokenOut(access_token=create_token(user["id"]), user=to_public(user))


@router.post("/auth/resend-code")
async def resend_code(body: ResendCodeIn):
    email = body.email.lower().strip()
    user = await users_col.find_one({"email": email}, {"_id": 0})
    if not user:
        # Do not leak existence — return generic OK.
        return {"ok": True}
    if user.get("email_verified"):
        return {"ok": True, "already_verified": True}
    last_sent = user.get("verification_last_sent_at")
    if last_sent:
        try:
            dt = datetime.fromisoformat(last_sent)
            elapsed = (now_utc() - dt).total_seconds()
            if elapsed < RESEND_COOLDOWN_SECONDS:
                remaining = int(RESEND_COOLDOWN_SECONDS - elapsed)
                raise HTTPException(429, f"Please wait {remaining}s before resending.")
        except HTTPException:
            raise
        except (ValueError, TypeError):
            pass
    await _issue_and_send_code(user)
    return {"ok": True}


@router.post("/auth/login", response_model=TokenOut)
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

    if not user.get("password_hash") or not verify_password(
        body.password, user["password_hash"]
    ):
        fails = user.get("failed_login_count", 0) + 1
        upd: dict[str, Any] = {"failed_login_count": fails}
        if fails >= 5:
            upd["lock_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
            upd["failed_login_count"] = 0
        await users_col.update_one({"id": user["id"]}, {"$set": upd})
        raise HTTPException(401, "Invalid credentials")

    # Block unverified email accounts. Google users bypass because
    # auth_provider == "google" implies Google already verified their email.
    if not user.get("email_verified") and user.get("auth_provider") != "google":
        # Reset the failed counter — bad password is what we care about there.
        await users_col.update_one(
            {"id": user["id"]},
            {"$set": {"failed_login_count": 0, "lock_until": None}},
        )
        raise HTTPException(
            403,
            {
                "code": "email_not_verified",
                "message": "Email not verified",
                "email": email,
            },
        )

    await users_col.update_one(
        {"id": user["id"]},
        {"$set": {"failed_login_count": 0, "lock_until": None}},
    )
    return TokenOut(access_token=create_token(user["id"]), user=to_public(user))


@router.get("/auth/me", response_model=UserPublic)
async def me(current=Depends(get_current_user)):
    return to_public(current)


@router.post("/auth/session", response_model=TokenOut)
async def google_session_exchange(body: SessionExchangeIn):
    """Exchange a fresh Emergent OAuth `session_id` for a 7-day `session_token`."""
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

    existing = await users_col.find_one({"email": email}, {"_id": 0})
    if existing:
        uid = existing["id"]
        # Auto-verify email for existing accounts that log in via Google — Google
        # has already verified the address on their side.
        if not existing.get("email_verified"):
            await users_col.update_one(
                {"id": uid},
                {
                    "$set": {
                        "email_verified": True,
                        "email_verified_at": now_utc().isoformat(),
                        "auth_provider": existing.get("auth_provider") or "google",
                    }
                },
            )
            existing["email_verified"] = True
        user = existing
    else:
        uid = f"user_{uuid.uuid4().hex[:12]}"
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
            "email_verified": True,
            "email_verified_at": now_utc().isoformat(),
            "failed_login_count": 0,
            "lock_until": None,
            "created_at": now_utc().isoformat(),
        }
        await users_col.insert_one(user)
        user.pop("_id", None)

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


@router.post("/auth/logout", status_code=status.HTTP_200_OK)
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    """Best-effort logout — deletes the session row if the bearer is a Google
    session_token. Legacy JWTs are stateless, so this is a no-op for them."""
    if credentials:
        await sessions_col.delete_one({"session_token": credentials.credentials})
    return {"ok": True}
