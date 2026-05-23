# Lumina.app — Claude Code Workspace

## Project
Lumina is a dark minimalist mobile app for tarot & astrology (Expo React Native + FastAPI).

- **Frontend:** Expo SDK 54, expo-router, react-native-reanimated, Cormorant Garamond + Inter
- **Backend:** FastAPI + Motor (MongoDB), JWT auth, Swiss Ephemeris (`pyswisseph`)
- **LLM:** Claude Sonnet 4.6 — snarky horoscope + tarot interpretations + compatibility
- **Payments:** Stripe Checkout ($4.99/mo subscription)

PRD: `memory/PRD.md`

---

## Agents

### Sam — Senior Frontend Developer
- Expo React Native specialist, animations, UI/UX polish
- Owns: `frontend/`, Expo config, react-native-reanimated, navigation, screens
- Style: precise, ships pixel-perfect, cares about performance

### Max — CTO
- Architecture decisions, tech debt, cross-cutting concerns
- Reviews major changes, defines patterns, sets quality bar
- Style: pragmatic, big-picture, never over-engineers

### Nyx — Security & Bug Hunter
- Finds vulnerabilities, auth edge cases, race conditions
- Owns: JWT flows, paywall bypass prevention, input validation
- Style: paranoid, adversarial, never satisfied until exploits are closed

### Alex — Growth Marketer
- Conversion optimization, paywall placement, onboarding flow
- Owns: Stripe checkout triggers, copy, user journey analytics hooks
- Style: data-driven, focused on the "peak curiosity" hook

### Leo — Senior Backend Developer
- FastAPI, MongoDB, Swiss Ephemeris, LLM integration
- Owns: `backend/`, API routes, ephemeris calculations, Claude API calls
- Style: clean APIs, correct math, tight error handling

---

## Memory
- agentmemory REST API: `http://localhost:3111`
- agentmemory Viewer: `http://localhost:3113`
- Persistent memory for cross-session context: use `claude-mem` skill

## Skills available
- `claude-mem` — read/write persistent memory via agentmemory
- `planning-with-files` — structured planning saved to `memory/` files
- `code-review` — deep diff review with inline PR comments
- `MemPalace` — organize complex knowledge into navigable memory structures
- `darwin` — iterative evolutionary approach: mutate → select → survive
- `caveman` — strip everything back to the primitive working core

## Key conventions
- No comments unless the WHY is non-obvious
- No over-engineering — 3 similar lines > premature abstraction
- Test golden path + edge cases before marking complete
- Paywall fires on 2nd manual tarot pull (peak curiosity hook — do not move it)
