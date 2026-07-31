"""End-to-end backend tests for Echo (Tarot + Astrology API).

Covers: auth (register/login/me, lockout), onboarding + natal chart,
horoscope (Claude), tarot deck/daily/manual (402 paywall), journal,
friends + compatibility (Claude), Stripe checkout + session retrieval.
"""
from __future__ import annotations

import os
import time
import uuid

import pytest
import requests

BASE_URL = "https://lumina-natal.preview.emergentagent.com"
API = f"{BASE_URL}/api"

# Unique per-run identifiers
RUN = uuid.uuid4().hex[:8]
USER_A = {
    "email": f"qa_a_{RUN}@example.com",
    "username": f"qa_a_{RUN}",
    "password": "EchoTest123",
}
USER_B = {
    "email": f"qa_b_{RUN}@example.com",
    "username": f"qa_b_{RUN}",
    "password": "EchoTest123",
}
BIRTH_A = {
    "birth_date": "1995-06-15",
    "birth_time": "14:30",
    "birth_place": "Los Angeles, USA",
    "birth_lat": 34.0522,
    "birth_lng": -118.2437,
}
BIRTH_B = {
    "birth_date": "1992-03-21",
    "birth_time": "09:15",
    "birth_place": "New York, USA",
    "birth_lat": 40.7128,
    "birth_lng": -74.0060,
}

# Shared cache across tests
STATE: dict = {}


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------- health
def test_00_health():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("status") == "ok"


# ---------------------------------------------------------------- auth
def test_01_register_user_a():
    r = requests.post(f"{API}/auth/register", json=USER_A, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "access_token" in body
    assert body["user"]["email"] == USER_A["email"]
    assert body["user"]["onboarded"] is False
    assert body["user"]["is_premium"] is False
    STATE["token_a"] = body["access_token"]
    STATE["user_a"] = body["user"]


def test_02_register_duplicate_email():
    r = requests.post(f"{API}/auth/register", json=USER_A, timeout=15)
    assert r.status_code == 400


def test_03_register_user_b():
    r = requests.post(f"{API}/auth/register", json=USER_B, timeout=20)
    assert r.status_code == 200, r.text
    STATE["token_b"] = r.json()["access_token"]
    STATE["user_b"] = r.json()["user"]


def test_04_login_user_a():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": USER_A["email"], "password": USER_A["password"]},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    assert "access_token" in r.json()


def test_05_login_wrong_password():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": USER_A["email"], "password": "WrongPass999"},
        timeout=15,
    )
    assert r.status_code == 401


def test_06_me_initial_onboarded_false():
    r = requests.get(f"{API}/auth/me", headers=auth_headers(STATE["token_a"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["onboarded"] is False
    assert body["email"] == USER_A["email"]


def test_07_me_missing_token():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


def test_07b_me_bogus_bearer_token():
    """A garbage token must return 401 (not 500)."""
    r = requests.get(
        f"{API}/auth/me",
        headers={"Authorization": "Bearer notavalidtoken"},
        timeout=15,
    )
    assert r.status_code == 401, r.text


# ---------------------------------------------------------------- Google OAuth session exchange
def test_08_auth_session_invalid_session_id():
    """Fake session_id must be rejected with 401 (not 500)."""
    fake_sid = f"fake_session_{uuid.uuid4().hex}"
    r = requests.post(
        f"{API}/auth/session", json={"session_id": fake_sid}, timeout=30
    )
    assert r.status_code == 401, r.text
    body = r.json()
    detail = (body.get("detail") or "").lower()
    assert "invalid" in detail or "expired" in detail, body


def test_08b_auth_session_missing_field():
    """Missing session_id field -> 422 (Pydantic validation)."""
    r = requests.post(f"{API}/auth/session", json={}, timeout=15)
    assert r.status_code == 422, r.text


def test_08c_auth_session_empty_string():
    """Empty session_id string -> 400 or 401, never 500."""
    r = requests.post(
        f"{API}/auth/session", json={"session_id": ""}, timeout=15
    )
    assert r.status_code in (400, 401, 422), r.text


# ---------------------------------------------------------------- logout
def test_09_logout_valid_jwt():
    """Logout with a JWT Bearer must return 200 {ok: true} (no-op)."""
    r = requests.post(
        f"{API}/auth/logout",
        headers=auth_headers(STATE["token_a"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    # JWT should still work after logout (JWT is not stored, endpoint is idempotent)
    r2 = requests.get(
        f"{API}/auth/me", headers=auth_headers(STATE["token_a"]), timeout=15
    )
    assert r2.status_code == 200, r2.text


def test_09b_logout_no_auth():
    """Logout without token still returns 200 (idempotent)."""
    r = requests.post(f"{API}/auth/logout", timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


# ---------------------------------------------------------------- onboarding + natal chart
def test_10_onboarding_birth_data_a():
    r = requests.post(
        f"{API}/onboarding/birth-data",
        json=BIRTH_A,
        headers=auth_headers(STATE["token_a"]),
        timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["onboarded"] is True
    assert body["birth_place"] == BIRTH_A["birth_place"]


def test_11_onboarding_birth_data_b():
    r = requests.post(
        f"{API}/onboarding/birth-data",
        json=BIRTH_B,
        headers=auth_headers(STATE["token_b"]),
        timeout=30,
    )
    assert r.status_code == 200, r.text
    assert r.json()["onboarded"] is True


def test_12_me_after_onboarding():
    r = requests.get(f"{API}/auth/me", headers=auth_headers(STATE["token_a"]), timeout=15)
    assert r.status_code == 200
    assert r.json()["onboarded"] is True


def test_13_natal_chart_structure():
    r = requests.get(
        f"{API}/natal-chart", headers=auth_headers(STATE["token_a"]), timeout=20
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "chart" in data and "summary" in data
    chart = data["chart"]
    planets = chart["planets"]
    for p in ["Sun", "Moon", "Mercury", "Venus", "Mars",
              "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]:
        assert p in planets, f"Missing planet {p}"
        assert "sign" in planets[p]
    assert "ascendant" in chart and "midheaven" in chart
    assert len(chart["houses"]) == 12


# ---------------------------------------------------------------- horoscope (Claude)
def test_20_horoscope_today_first_call():
    r = requests.get(
        f"{API}/horoscope/today", headers=auth_headers(STATE["token_a"]), timeout=60
    )
    # 503 is acceptable per iteration_2 spec: EMERGENT_LLM_KEY budget cap
    assert r.status_code in (200, 503), r.text
    STATE["horoscope_llm_ok"] = r.status_code == 200
    if r.status_code == 200:
        body = r.json()
        assert body["cached"] is False
        assert isinstance(body["text"], str) and len(body["text"]) > 20
        STATE["horoscope_text"] = body["text"]


def test_21_horoscope_today_second_call_cached():
    if not STATE.get("horoscope_llm_ok"):
        pytest.skip("first horoscope call was 503 (LLM budget)")
    r = requests.get(
        f"{API}/horoscope/today", headers=auth_headers(STATE["token_a"]), timeout=15
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["cached"] is True
    assert body["text"] == STATE["horoscope_text"]


# ---------------------------------------------------------------- tarot
def test_30_tarot_deck():
    r = requests.get(f"{API}/tarot/deck", timeout=15)
    assert r.status_code == 200
    cards = r.json()["cards"]
    assert len(cards) == 78
    majors = [c for c in cards if c["arcana"] == "major"]
    minors = [c for c in cards if c["arcana"] == "minor"]
    assert len(majors) == 22
    assert len(minors) == 56


def test_31_tarot_daily_first_call():
    r = requests.get(
        f"{API}/tarot/daily", headers=auth_headers(STATE["token_a"]), timeout=60
    )
    assert r.status_code in (200, 503), r.text
    STATE["tarot_daily_ok"] = r.status_code == 200
    if r.status_code == 200:
        body = r.json()
        assert body["kind"] == "daily"
        assert "card_name" in body and "interpretation" in body
        assert len(body["interpretation"]) > 10
        STATE["daily_card"] = body["card_name"]
        STATE["daily_interp"] = body["interpretation"]


def test_32_tarot_daily_cached():
    if not STATE.get("tarot_daily_ok"):
        pytest.skip("first tarot daily call was 503 (LLM budget)")
    r = requests.get(
        f"{API}/tarot/daily", headers=auth_headers(STATE["token_a"]), timeout=15
    )
    assert r.status_code == 200
    body = r.json()
    assert body["card_name"] == STATE["daily_card"]
    assert body["interpretation"] == STATE["daily_interp"]


def test_33_tarot_manual_draw_first_free():
    r = requests.post(
        f"{API}/tarot/draw",
        json={"question": "What should I focus on today?"},
        headers=auth_headers(STATE["token_a"]),
        timeout=60,
    )
    assert r.status_code in (200, 503), r.text
    STATE["tarot_manual_ok"] = r.status_code == 200
    if r.status_code == 200:
        body = r.json()
        assert body["kind"] == "manual"
        assert body["question"] == "What should I focus on today?"


def test_34_tarot_manual_draw_second_paywall():
    if not STATE.get("tarot_manual_ok"):
        pytest.skip("first manual draw was 503 (LLM budget) so no paywall row")
    r = requests.post(
        f"{API}/tarot/draw",
        json={"question": "Another?"},
        headers=auth_headers(STATE["token_a"]),
        timeout=30,
    )
    assert r.status_code == 402, r.text
    assert "premium" in r.text.lower() or "upgrade" in r.text.lower()


# ---------------------------------------------------------------- journal
def test_40_journal_newest_first():
    r = requests.get(
        f"{API}/journal", headers=auth_headers(STATE["token_a"]), timeout=15
    )
    assert r.status_code == 200
    items = r.json()["items"]
    # Sorted by created_at desc
    times = [it["created_at"] for it in items]
    assert times == sorted(times, reverse=True)


# ---------------------------------------------------------------- friends
def test_50_friends_add_invalid_user():
    r = requests.post(
        f"{API}/friends/add",
        json={"username": f"nope_{RUN}"},
        headers=auth_headers(STATE["token_a"]),
        timeout=15,
    )
    assert r.status_code == 404


def test_51_friends_add_self():
    r = requests.post(
        f"{API}/friends/add",
        json={"username": USER_A["username"]},
        headers=auth_headers(STATE["token_a"]),
        timeout=15,
    )
    assert r.status_code == 400


def test_52_friends_add_b():
    r = requests.post(
        f"{API}/friends/add",
        json={"username": USER_B["username"]},
        headers=auth_headers(STATE["token_a"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["friend"]["username"] == USER_B["username"].lower()
    STATE["friend_b_id"] = body["friend"]["id"]


def test_53_friends_add_idempotent():
    r = requests.post(
        f"{API}/friends/add",
        json={"username": USER_B["username"]},
        headers=auth_headers(STATE["token_a"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text


def test_54_friends_list():
    r = requests.get(
        f"{API}/friends", headers=auth_headers(STATE["token_a"]), timeout=15
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(f["id"] == STATE["friend_b_id"] for f in items)


def test_55_compatibility_first_call():
    r = requests.post(
        f"{API}/friends/compatibility",
        json={"friend_id": STATE["friend_b_id"]},
        headers=auth_headers(STATE["token_a"]),
        timeout=90,
    )
    assert r.status_code in (200, 503), r.text
    STATE["compat_ok"] = r.status_code == 200
    if r.status_code == 200:
        body = r.json()
        assert isinstance(body["score"], int)
        assert 0 <= body["score"] <= 100
        assert len(body["reading"]) > 20
        STATE["compat_score"] = body["score"]
        STATE["compat_reading"] = body["reading"]


def test_56_compatibility_cached():
    if not STATE.get("compat_ok"):
        pytest.skip("first compat call was 503 (LLM budget)")
    r = requests.post(
        f"{API}/friends/compatibility",
        json={"friend_id": STATE["friend_b_id"]},
        headers=auth_headers(STATE["token_a"]),
        timeout=15,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["score"] == STATE["compat_score"]
    assert body["reading"] == STATE["compat_reading"]


def test_57_friends_list_with_compat_score():
    r = requests.get(
        f"{API}/friends", headers=auth_headers(STATE["token_a"]), timeout=15
    )
    assert r.status_code == 200
    items = r.json()["items"]
    target = next((f for f in items if f["id"] == STATE["friend_b_id"]), None)
    assert target is not None
    if STATE.get("compat_ok"):
        assert target["compat_score"] == STATE["compat_score"]


# ---------------------------------------------------------------- stripe
def test_60_stripe_checkout():
    r = requests.post(
        f"{API}/stripe/checkout", headers=auth_headers(STATE["token_a"]), timeout=30
    )
    # With placeholder key 'sk_test_emergent', Stripe returns 401 which server wraps to 503
    assert r.status_code in (200, 503), r.text
    if r.status_code == 503:
        detail = (r.json().get("detail") or "").lower()
        # Ensure API key value is NOT leaked
        assert "sk_test" not in detail
        STATE["stripe_ok"] = False
        return
    STATE["stripe_ok"] = True
    body = r.json()
    assert body["url"].startswith("https://")
    assert body["session_id"].startswith("cs_")
    STATE["session_id"] = body["session_id"]


def test_61_stripe_session_retrieval():
    if not STATE.get("stripe_ok"):
        pytest.skip("Stripe checkout returned 503 (env issue: placeholder key)")
    r = requests.get(
        f"{API}/stripe/session/{STATE['session_id']}",
        headers=auth_headers(STATE["token_a"]),
        timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "payment_status" in body
    assert body["is_premium"] is False


# ---------------------------------------------------------------- lockout (run last)
def test_90_login_lockout_after_5_failures():
    """5 wrong logins should lock the account (403)."""
    # Use a throwaway user to not interfere with above
    throwaway = {
        "email": f"qa_lock_{RUN}@example.com",
        "username": f"qa_lock_{RUN}",
        "password": "EchoTest123",
    }
    r = requests.post(f"{API}/auth/register", json=throwaway, timeout=15)
    assert r.status_code == 200

    for i in range(5):
        rr = requests.post(
            f"{API}/auth/login",
            json={"email": throwaway["email"], "password": "WrongPass"},
            timeout=15,
        )
        assert rr.status_code == 401, f"attempt {i+1}: {rr.status_code} {rr.text}"

    # 6th attempt (even with correct password) should be locked
    r2 = requests.post(
        f"{API}/auth/login",
        json={"email": throwaway["email"], "password": throwaway["password"]},
        timeout=15,
    )
    assert r2.status_code == 403, f"expected lockout but got {r2.status_code}: {r2.text}"
