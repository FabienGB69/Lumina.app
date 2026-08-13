"""Central config — loads .env once (must be imported before llm_service).

All other modules import env constants from here, so `load_dotenv()` runs
exactly once at process start and downstream libs (litellm/anthropic via
emergentintegrations) see the required keys.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env at import time, before any downstream module reads os.environ.
ROOT_DIR = Path(__file__).resolve().parent.parent  # /app/backend
load_dotenv(ROOT_DIR / ".env")

# Required
MONGO_URL: str = os.environ["MONGO_URL"]
DB_NAME: str = os.environ["DB_NAME"]
JWT_SECRET: str = os.environ["JWT_SECRET"]

# Optional / defaulted
JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "43200")
)
STRIPE_API_KEY: str = os.environ.get("STRIPE_API_KEY", "")
STRIPE_PRICE_AMOUNT: int = int(os.environ.get("STRIPE_PREMIUM_PRICE_AMOUNT", "499"))
STRIPE_CURRENCY: str = os.environ.get("STRIPE_PREMIUM_CURRENCY", "usd")
APP_URL: str = os.environ.get("APP_URL", "")

# Email (Emergent-managed Resend)
EMERGENT_EMAIL_KEY: str = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME: str = os.environ.get("EMAIL_FROM_NAME", "Lumina")
# Hardcoded per playbook — survives redeploy.
EMAIL_BASE_URL = "https://integrations.emergentagent.com"

EMERGENT_SESSION_DATA_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)
