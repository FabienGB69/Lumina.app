# Echo — PRD

## Overview
**Echo** is a sleek, dark, minimalist mobile app (Expo React Native) for tarot & astrology, inspired by Co-Star. Tone: snarky, direct, observant. Each user gets a real astronomical natal chart, a daily horoscope, and one tarot pull per day for free. Premium ($4.99/mo via Stripe) unlocks unlimited tarot pulls and deeper interpretations.

## Tech stack
- **Frontend:** Expo SDK 54, expo-router, react-native-reanimated, Cormorant Garamond + Inter (Google Fonts)
- **Backend:** FastAPI + Motor (MongoDB), JWT auth (bcrypt), Swiss Ephemeris (`pyswisseph` Moshier model)
- **LLM:** Claude Sonnet 4.5 via Emergent universal key (snarky horoscope + tarot interpretations + compatibility)
- **Payments:** Stripe Checkout (subscription, $4.99/mo) — uses pod test key `sk_test_emergent`

## Implemented features
- **Auth (JWT)**: register / login / me — bcrypt + 5-strike lockout
- **Onboarding (3 steps)**: birth date → time → city picker (35 preset cities)
- **Natal chart** (`pyswisseph` Moshier flag, no ephemeris files): Sun, Moon, Mercury–Pluto, Ascendant, Midheaven, Placidus houses, timezone-aware UTC conversion via `timezonefinder`
- **Daily horoscope** (1/day, cached) — Claude generates a personalized snarky reading from chart placements
- **Daily tarot pull** (auto, 1/day, cached) with snarky LLM interpretation
- **Manual tarot draw** with flip animation (Reanimated 3D rotateY) — free: 1/day; premium: unlimited (paywall triggers on 402)
- **Friends**: add by username, compatibility readings (LLM returns score 0-100 + 2-3 paragraphs)
- **Journal**: chronological list of all readings
- **Profile**: shows Sun/Moon/Rising + all 10 planet placements, premium badge, sign out
- **Stripe paywall**: `POST /api/stripe/checkout` → opens Stripe Checkout in browser → polls `GET /api/stripe/session/{id}` to confirm; also webhook endpoint ready
- **78-card RWS deck** (data only; minimalist card visual rendered in code, stark border + name + keywords)

## Future enhancements
- iCloud / Google calendar sync for transits
- Custom card spreads (3-card, Celtic Cross) for premium
- Push notifications (`expo-notifications`) at sunrise — requires EAS build
- Voice readings (TTS)

## Smart business enhancement
The freemium model is built around addictive ritual: free users get exactly one daily tarot, but the manual-draw paywall is contextual — it triggers at the precise moment of curiosity (after the question is typed), maximizing conversion intent.
