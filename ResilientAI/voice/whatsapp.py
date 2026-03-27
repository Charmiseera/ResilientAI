"""
WhatsApp Alert Integration via Twilio.
Sends supply disruption alerts to registered MSME users.
"""
from __future__ import annotations
import os
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

_TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
_TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
_TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")


@dataclass
class AlertMessage:
    to_number: str         # E.164 format e.g. "+919876543210"
    event_headline: str
    risk_level: str
    recommendation: str
    profit_impact_inr: float
    lang: str = "en"


def _format_message(alert: AlertMessage) -> str:
    if alert.lang == "hi":
        return (
            f"🚨 *ResilientAI Alert* — {alert.risk_level} Risk\n\n"
            f"📢 *Kya hua:* {alert.event_headline}\n\n"
            f"💡 *Kya karein:* {alert.recommendation}\n\n"
            f"📈 *Expected faayda:* ₹{alert.profit_impact_inr:,.0f}/hafte\n\n"
            f"_ResilientAI — Aapke business ka AI guard_ 🇮🇳"
        )
    return (
        f"🚨 *ResilientAI Alert* — {alert.risk_level} Risk\n\n"
        f"📢 *Event:* {alert.event_headline}\n\n"
        f"💡 *Action:* {alert.recommendation}\n\n"
        f"📈 *Profit impact:* +₹{alert.profit_impact_inr:,.0f}/week\n\n"
        f"_ResilientAI — Your AI supply guard_ 🇮🇳"
    )


def send_whatsapp_alert(alert: AlertMessage) -> dict:
    """
    Send a WhatsApp alert via Twilio.
    Returns {"success": bool, "sid": str, "error": str}.
    Falls back to simulation if Twilio credentials not set.
    """
    message_body = _format_message(alert)

    # Simulation mode — no real API call
    if not _TWILIO_SID or not _TWILIO_TOKEN:
        logger.info("[WhatsApp SIMULATED] To: %s\n%s", alert.to_number, message_body)
        return {
            "success": True,
            "sid": "SIMULATED_SID_001",
            "message": message_body,
            "mode": "simulation",
        }

    try:
        from twilio.rest import Client
        client = Client(_TWILIO_SID, _TWILIO_TOKEN)
        msg = client.messages.create(
            body=message_body,
            from_=_TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{alert.to_number}",
        )
        logger.info("WhatsApp sent: SID=%s", msg.sid)
        return {"success": True, "sid": msg.sid, "mode": "live"}
    except Exception as exc:
        logger.error("WhatsApp send failed: %s", exc)
        return {"success": False, "sid": "", "error": str(exc)}


def broadcast_alert(
    event: dict,
    recommendation: str,
    profit_inr: float,
    phone_numbers: list[str],
    lang: str = "en",
) -> list[dict]:
    """
    Send alert to multiple registered MSME users.

    Args:
        event: DisruptionEvent dict
        recommendation: Recommended action text
        profit_inr: Estimated profit impact
        phone_numbers: List of E.164 phone numbers
        lang: "en" or "hi"

    Returns:
        List of send results per number.
    """
    results = []
    for number in phone_numbers:
        alert = AlertMessage(
            to_number=number,
            event_headline=event.get("headline", "Supply disruption detected"),
            risk_level=event.get("risk_level", "HIGH"),
            recommendation=recommendation,
            profit_impact_inr=profit_inr,
            lang=lang,
        )
        results.append(send_whatsapp_alert(alert))
    return results
