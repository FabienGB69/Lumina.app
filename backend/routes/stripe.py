"""Stripe checkout + session polling + webhook."""
from __future__ import annotations

import json
import logging

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request

from core.config import (
    APP_URL,
    STRIPE_API_KEY,
    STRIPE_CURRENCY,
    STRIPE_PRICE_AMOUNT,
)
from core.db import payments_col, users_col
from core.deps import get_current_user
from core.security import now_utc
from models import CheckoutOut

# Configure the SDK once at module load.
stripe.api_key = STRIPE_API_KEY

logger = logging.getLogger("lumina.stripe")
router = APIRouter(tags=["stripe"])


@router.post("/stripe/checkout", response_model=CheckoutOut)
async def create_checkout(current=Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(503, "Payments not configured")
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[
                {
                    "price_data": {
                        "currency": STRIPE_CURRENCY,
                        "product_data": {"name": "Lumina Premium"},
                        "unit_amount": STRIPE_PRICE_AMOUNT,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
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
    await payments_col.insert_one(
        {
            "user_id": current["id"],
            "session_id": session.id,
            "status": "pending",
            "amount": STRIPE_PRICE_AMOUNT,
            "currency": STRIPE_CURRENCY,
            "created_at": now_utc().isoformat(),
        }
    )
    return CheckoutOut(url=session.url, session_id=session.id)


@router.get("/stripe/session/{session_id}")
async def check_session(session_id: str, current=Depends(get_current_user)):
    """Polled by client after checkout to confirm subscription activation."""
    if not STRIPE_API_KEY:
        raise HTTPException(503, "Payments not configured")
    try:
        sess = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.AuthenticationError:
        logger.exception("stripe auth error on session retrieve")
        raise HTTPException(503, "Payments not configured. Please contact support.")
    except Exception as e:
        logger.exception("stripe session retrieve error")
        raise HTTPException(400, f"Session retrieval failed: {e}")
    payment_status = sess.get("payment_status")
    sub_id = sess.get("subscription")
    if sess.get("client_reference_id") and sess["client_reference_id"] != current["id"]:
        raise HTTPException(403, "Not your session")
    if payment_status == "paid":
        await users_col.update_one(
            {"id": current["id"]},
            {
                "$set": {
                    "is_premium": True,
                    "stripe_subscription_id": sub_id,
                    "premium_since": now_utc().isoformat(),
                }
            },
        )
        await payments_col.update_one(
            {"session_id": session_id},
            {"$set": {"status": "paid", "subscription_id": sub_id}},
        )
    return {"payment_status": payment_status, "is_premium": payment_status == "paid"}


async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None),
):
    """Mounted directly on `app` in server.py (path: /api/stripe/webhook)."""
    payload = await request.body()
    try:
        event = stripe.Event.construct_from(
            json.loads(payload.decode()), stripe.api_key
        )
    except Exception as e:
        raise HTTPException(400, f"Bad payload: {e}")
    if event["type"] == "checkout.session.completed":
        sess = event["data"]["object"]
        uid = sess.get("client_reference_id")
        if uid:
            await users_col.update_one(
                {"id": uid},
                {
                    "$set": {
                        "is_premium": True,
                        "stripe_subscription_id": sess.get("subscription"),
                        "premium_since": now_utc().isoformat(),
                    }
                },
            )
    elif event["type"] in (
        "customer.subscription.deleted",
        "customer.subscription.updated",
    ):
        sub = event["data"]["object"]
        status_ = sub.get("status")
        sub_id = sub.get("id")
        if status_ in ("canceled", "unpaid", "incomplete_expired"):
            await users_col.update_one(
                {"stripe_subscription_id": sub_id},
                {"$set": {"is_premium": False}},
            )
    return {"received": True}
