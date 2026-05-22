# Lumina — PRD

## Overview
**Lumina** is a sleek, dark, minimalist mobile app (Expo React Native) for tarot & astrology, inspired by Co-Star. Tone: snarky, direct, observant. Each user gets a real astronomical natal chart, a daily horoscope, and one tarot pull per day for free. Premium ($4.99/mo via Stripe) unlocks unlimited tarot pulls and deeper interpretations.

## Tech stack
- **Frontend:** Expo SDK 54, expo-router, react-native-reanimated, Cormorant Garamond + Inter (Google Fonts)
- **Backend:** FastAPI + Motor (MongoDB), JWT auth (bcrypt), Swiss Ephemeris (`pyswisseph` Moshier model)
- **LLM:** Claude Sonnet 4.5 via Emergent universal key (snarky horoscope + tarot interpretations + compatibility)
- **Payments:** Stripe Checkout (subscription, $4.99/mo)

## Implemented features
- **Auth (JWT)**: register / login / me — bcrypt + 5-strike lockout
- **Onboarding (3 steps)**: birth date → time → city picker (35 preset cities)
- **Natal chart** (`pyswisseph` Moshier flag, no ephemeris files): Sun, Moon, Mercury–Pluto, Ascendant, Midheaven, Placidus houses, timezone-aware
- **Daily horoscope** (1/day, cached) — Claude generates personalized snarky reading
- **Daily tarot pull** (auto, 1/day, cached) with snarky LLM interpretation
- **Manual tarot draw** with 3D flip animation — free: 1/day; premium: unlimited (paywall on 402)
- **Friends**: add by username, AI compatibility (score 0-100 + reading)
- **Journal**: chronological readings list
- **Profile**: Sun/Moon/Rising + all 10 planet placements, premium badge, sign out
- **Stripe paywall**: checkout session + polling confirmation
- **78-card RWS deck** with stark minimalist card visuals

## Smart business hook
Paywall fires precisely after a user types their question and hits "DRAW" on a 2nd manual pull — captures peak curiosity intent for max conversion.
