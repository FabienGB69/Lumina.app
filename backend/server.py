"""Lumina backend — FastAPI app entrypoint.

Tarot + Astrology API. Handles:
- Custom JWT + Emergent Google OAuth auth
- Natal chart (pyswisseph)
- Daily horoscope + tarot pulls (Claude Sonnet 4.5 via Emergent LLM key)
- Friends CRUD + compatibility
- Journal
- Stripe subscription checkout + webhook

The heavy lifting lives in the `routes/`, `services/` and `core/` packages.
"""
from __future__ import annotations

import logging

# Load env FIRST (before llm_service reads keys). config module handles this.
from core import config  # noqa: F401  # side-effect: load_dotenv()

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from core.db import client as mongo_client
from core.db import ensure_indexes
from routes.auth import router as auth_router
from routes.friends import router as friends_router
from routes.onboarding import router as onboarding_router
from routes.stripe import router as stripe_router
from routes.stripe import stripe_webhook
from routes.tarot import router as tarot_router
from routes.users import router as users_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lumina")

app = FastAPI(title="Lumina API")

# All app routes live under /api (Kubernetes ingress prefix)
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"status": "ok", "app": "Lumina"}


api.include_router(auth_router)
api.include_router(users_router)
api.include_router(onboarding_router)
api.include_router(tarot_router)
api.include_router(friends_router)
api.include_router(stripe_router)

app.include_router(api)

# Stripe webhook — mounted directly on app so it bypasses the /api router's
# default response processing. Path still starts with /api to match ingress.
app.add_api_route(
    "/api/stripe/webhook",
    stripe_webhook,
    methods=["POST"],
    tags=["stripe"],
)

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
        await ensure_indexes()
    except Exception:
        logger.exception("index creation failed")


@app.on_event("shutdown")
async def _shutdown_db_client():
    mongo_client.close()
