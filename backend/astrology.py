"""Natal chart computation using Swiss Ephemeris (Moshier built-in model).
No external ephemeris files required."""
from datetime import datetime, timezone
import swisseph as swe
import pytz
from timezonefinder import TimezoneFinder

_TF = TimezoneFinder()

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
}

# Use built-in Moshier (no ephemeris files needed)
FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED


def sign_of(degree: float) -> tuple[str, float]:
    """Given ecliptic longitude (0–360), return (sign, degrees_within_sign)."""
    d = degree % 360
    idx = int(d // 30)
    return ZODIAC_SIGNS[idx], d - idx * 30


def to_utc(birth_date: str, birth_time: str, lat: float, lng: float) -> datetime:
    """birth_date YYYY-MM-DD, birth_time HH:MM, return UTC datetime."""
    tz_name = _TF.timezone_at(lat=lat, lng=lng) or "UTC"
    local_tz = pytz.timezone(tz_name)
    naive = datetime.strptime(f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M")
    local_dt = local_tz.localize(naive)
    return local_dt.astimezone(timezone.utc), tz_name


def compute_natal_chart(birth_date: str, birth_time: str, lat: float, lng: float) -> dict:
    """
    Compute natal chart placements using Swiss Ephemeris Moshier model.
    Returns dict with planet positions, ascendant, midheaven, houses.
    """
    utc_dt, tz_name = to_utc(birth_date, birth_time, lat, lng)

    # Julian Day UT
    hour_decimal = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hour_decimal)

    planets = {}
    for name, pid in PLANETS.items():
        xx, _ = swe.calc_ut(jd, pid, FLAGS)
        lon = xx[0]
        sign, deg = sign_of(lon)
        planets[name] = {
            "longitude": round(lon, 4),
            "sign": sign,
            "degrees": round(deg, 2),
            "retrograde": xx[3] < 0,
        }

    # Houses (Placidus). swe.houses returns (cusps, ascmc)
    try:
        cusps, ascmc = swe.houses(jd, lat, lng, b"P")
        asc_lon = ascmc[0]
        mc_lon = ascmc[1]
        asc_sign, asc_deg = sign_of(asc_lon)
        mc_sign, mc_deg = sign_of(mc_lon)
        houses = []
        for i, c in enumerate(cusps[:12], start=1):
            s, d = sign_of(c)
            houses.append({"house": i, "cusp": round(c, 4), "sign": s, "degrees": round(d, 2)})
    except Exception:
        asc_sign, asc_deg, mc_sign, mc_deg = "Unknown", 0, "Unknown", 0
        houses = []

    return {
        "tz": tz_name,
        "utc": utc_dt.isoformat(),
        "planets": planets,
        "ascendant": {"sign": asc_sign, "degrees": round(asc_deg, 2)},
        "midheaven": {"sign": mc_sign, "degrees": round(mc_deg, 2)},
        "houses": houses,
    }


def chart_summary(chart: dict) -> str:
    """Short string summary suitable for LLM prompts."""
    p = chart["planets"]
    return (
        f"Sun in {p['Sun']['sign']} ({p['Sun']['degrees']}°), "
        f"Moon in {p['Moon']['sign']} ({p['Moon']['degrees']}°), "
        f"Ascendant in {chart['ascendant']['sign']} ({chart['ascendant']['degrees']}°), "
        f"Mercury in {p['Mercury']['sign']}, Venus in {p['Venus']['sign']}, "
        f"Mars in {p['Mars']['sign']}, Jupiter in {p['Jupiter']['sign']}, "
        f"Saturn in {p['Saturn']['sign']}."
    )
