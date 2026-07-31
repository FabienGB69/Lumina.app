"""LLM service for Lumina - Claude Sonnet 4.5 via emergentintegrations.
Snarky, direct Co-Star style voice. Multilingual output driven by `lang` param.
"""
import os
import uuid
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"

# Human-readable language names Claude understands well.
LANG_NAMES = {
    "en": "English",
    "fr": "French (français)",
}


def _lang_name(lang: str | None) -> str:
    return LANG_NAMES.get((lang or "en").lower(), "English")


def _voice_directive(lang: str | None) -> str:
    lang_name = _lang_name(lang)
    return (
        "You are Lumina, the voice of a sharp, snarky, observant astrology and tarot reader. "
        "Your tone is direct, slightly confrontational, observant, unbothered. Co-Star style. "
        "Short sentences. No emojis. No 'dear seeker' nonsense. "
        "Speak as if you know the user better than they do. "
        "Be specific, never vague. Use 2nd person. Maximum 3 short paragraphs.\n"
        f"IMPORTANT: Write your entire response in {lang_name}. "
        "Use natural, native-level phrasing for that language — do not translate literally from English."
    )


def _chat(system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)


async def daily_horoscope(
    chart_summary: str, today_iso: str, lang: str | None = "en"
) -> str:
    system = (
        _voice_directive(lang)
        + "\nGenerate a daily horoscope for the user based on their natal chart. "
        + "Reference one specific transit, mood, or warning. Make it feel personal and pointed. "
        + "Under 90 words."
    )
    user_text = (
        f"Date: {today_iso}.\n"
        f"User's natal chart: {chart_summary}\n\n"
        "Write today's horoscope."
    )
    chat = _chat(system)
    return (await chat.send_message(UserMessage(text=user_text))).strip()


async def tarot_interpretation(
    card_name: str,
    keywords: list[str],
    chart_summary: str,
    question: str | None = None,
    reversed_: bool = False,
    lang: str | None = "en",
) -> str:
    orient = "reversed" if reversed_ else "upright"
    system = (
        _voice_directive(lang)
        + "\nInterpret a tarot card pull for the user. "
        + "Tie it to their natal chart placements when useful. "
        + "Be confrontational and specific. Under 110 words."
    )
    q_part = f"Question: {question}\n" if question else ""
    user_text = (
        f"Card drawn: {card_name} ({orient})\n"
        f"Card keywords: {', '.join(keywords)}\n"
        f"Natal chart: {chart_summary}\n"
        f"{q_part}\n"
        "Give your reading."
    )
    chat = _chat(system)
    return (await chat.send_message(UserMessage(text=user_text))).strip()


async def compatibility_reading(
    user_chart: str,
    friend_chart: str,
    user_name: str,
    friend_name: str,
    lang: str | None = "en",
) -> dict:
    system = (
        _voice_directive(lang)
        + "\nAnalyze the compatibility between two people based on their natal charts. "
        + "Return two things on separate lines. The SCORE line MUST always be in English "
        + "with this exact format so we can parse it:\n"
        + "SCORE: <integer 0-100>\n"
        + "READING: <2-3 short snarky paragraphs about the dynamic — in the target language>\n"
        + "Be honest. If it's bad, say so. If it's good, find the friction anyway."
    )
    user_text = (
        f"Person A ({user_name}): {user_chart}\n\n"
        f"Person B ({friend_name}): {friend_chart}\n\n"
        "Analyze."
    )
    chat = _chat(system)
    raw = (await chat.send_message(UserMessage(text=user_text))).strip()

    score = 50
    reading = raw
    for line in raw.splitlines():
        if line.upper().startswith("SCORE:"):
            try:
                score = int("".join(c for c in line.split(":", 1)[1] if c.isdigit())[:3])
                score = max(0, min(100, score))
            except (ValueError, IndexError):
                pass
        elif line.upper().startswith("READING:"):
            reading = line.split(":", 1)[1].strip()
    if reading == raw:
        reading = "\n".join(
            ln for ln in raw.splitlines() if not ln.upper().startswith("SCORE:")
        ).strip()
    return {"score": score, "reading": reading}
