# MemPalace

Organize complex knowledge into a navigable mental map stored in `memory/palace/`.

## Usage
`/MemPalace [room] [topic]`

## Instructions

The Memory Palace maps the Lumina codebase into "rooms" — each room is a domain you can walk through to find anything.

### Rooms
| Room | Owns |
|------|------|
| `auth` | JWT, bcrypt, lockout logic |
| `charts` | Swiss Ephemeris, natal chart, houses |
| `tarot` | 78-card deck, flip animation, paywall hook |
| `horoscope` | Daily generation, caching, LLM call |
| `friends` | Add by username, compatibility score |
| `payments` | Stripe checkout, subscription polling |
| `ui` | Screens, navigation, animations, fonts |
| `api` | FastAPI routes, MongoDB Motor, error handling |

### Navigate a room
Read `memory/palace/<room>.md` — it contains:
- Key files + line numbers for entry points
- Gotchas and hidden invariants
- Past bugs and their fixes

### Update a room
After changing something significant in a domain, update the palace entry with what changed and why. Keep entries short — palace entries are navigation aids, not documentation.
