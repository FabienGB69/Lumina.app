"""Email sending — Emergent-managed Resend proxy.

Non-blocking async send. Never raises to callers (caller decides whether the
absence of email is fatal); returns True/False + optional error string.
"""
from __future__ import annotations

import logging

import httpx

from core.config import EMAIL_BASE_URL, EMAIL_FROM_NAME, EMERGENT_EMAIL_KEY

logger = logging.getLogger("lumina.email")


async def send_email(
    to: str,
    subject: str,
    html: str,
    *,
    reply_to: str | None = None,
) -> tuple[bool, str | None]:
    """Send a transactional email. Returns (ok, error_message)."""
    if not EMERGENT_EMAIL_KEY:
        return False, "Email provider not configured"
    payload: dict = {
        "to": [to],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMERGENT_EMAIL_KEY},
                json=payload,
            )
    except httpx.HTTPError as e:
        logger.exception("email network error")
        return False, str(e)
    if resp.status_code >= 400:
        logger.error("email send failed: %s %s", resp.status_code, resp.text[:200])
        return False, f"HTTP {resp.status_code}"
    return True, None


def verification_email_html(code: str, lang: str = "en") -> tuple[str, str]:
    """Return (subject, html) for the verification email in `lang`."""
    if lang == "fr":
        subject = f"Ton code Lumina : {code}"
        body = (
            "<p>Salut,</p>"
            "<p>Voici ton code de vérification :</p>"
            f'<p style="font-size:32px; letter-spacing:8px; font-weight:600; '
            f'color:#3A1580; margin:24px 0;">{code}</p>'
            "<p>Il expire dans 15 minutes.</p>"
            "<p>Si tu n'as pas créé de compte Lumina, ignore ce message.</p>"
            "<p>— Lumina</p>"
        )
    else:
        subject = f"Your Lumina code: {code}"
        body = (
            "<p>Hi,</p>"
            "<p>Here is your verification code:</p>"
            f'<p style="font-size:32px; letter-spacing:8px; font-weight:600; '
            f'color:#3A1580; margin:24px 0;">{code}</p>'
            "<p>It expires in 15 minutes.</p>"
            "<p>If you didn't create a Lumina account, ignore this email.</p>"
            "<p>— Lumina</p>"
        )
    html = f"""<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif; background:#0B0418; padding:24px; color:#F4EDE0;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width:520px; margin:0 auto; background:#140829; border-radius:16px; padding:32px;">
    <tr><td>
      <div style="text-align:center; color:#F0C560; letter-spacing:8px; font-size:12px; font-weight:600; margin-bottom:24px;">LUMINA</div>
      <div style="color:#F4EDE0; font-size:16px; line-height:1.6;">{body}</div>
    </td></tr>
  </table>
</body></html>"""
    return subject, html
