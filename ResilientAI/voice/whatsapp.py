"""
WhatsApp Alert Integration via Meta Cloud API.
Sends supply disruption alerts to registered MSME users.
"""
from __future__ import annotations
import os
import logging
from dataclasses import dataclass
from dotenv import load_dotenv

# Load .env so credentials are available even when run via Streamlit
load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class AlertMessage:
    to_number: str         # E.164 format e.g. "919876543210" (no + for Meta)
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
    Send a WhatsApp alert via Meta Cloud API.
    Returns {"success": bool, "id": str, "error": str}.
    Falls back to simulation if Meta credentials not set.
    """
    # Read credentials at call-time so load_dotenv() is always applied
    meta_token = os.getenv("WHATSAPP_TOKEN", "")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

    message_body = _format_message(alert)

    # Simulation mode — no real API call
    if not meta_token or not phone_id:
        logger.info("[WhatsApp SIMULATED] To: %s\n%s", alert.to_number, message_body)
        return {
            "success": True,
            "id": "SIMULATED_ID_001",
            "message": message_body,
            "mode": "simulation",
        }

    try:
        import httpx
        url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {meta_token}",
            "Content-Type": "application/json",
        }
        # Meta expects the number without leading '+' or spaces
        clean_number = alert.to_number.replace("+", "").replace(" ", "")

        # Try free-text first (works when recipient has messaged in last 24h)
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_number,
            "type": "text",
            "text": {"body": message_body},
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response_data = response.json()

        if response.status_code == 200:
            msg_id = response_data.get("messages", [{}])[0].get("id", "")
            logger.info("WhatsApp sent via Meta (free-text): ID=%s", msg_id)
            return {"success": True, "id": msg_id, "mode": "live"}

        # Error 131026 = outside 24h session window → fall back to template
        error_code = response_data.get("error", {}).get("code", 0)
        error_msg = response_data.get("error", {}).get("message", "Unknown error")

        if error_code == 190:
            custom_error = (
                "Meta access token has EXPIRED. "
                "Go to Meta Developer Console → WhatsApp → API Setup → generate a new token, "
                "then update WHATSAPP_TOKEN in your .env file."
            )
            logger.error("Meta WhatsApp token expired (code 190): %s", error_msg)
            return {"success": False, "id": "", "error": custom_error, "mode": "failed"}

        if error_code == 131030:
            custom_error = "Number not verified. Add this phone number to 'To' list in Meta Developer Console."
            logger.error("Meta WhatsApp send failed: %s", custom_error)
            return {"success": False, "id": "", "error": custom_error, "mode": "failed"}

        if error_code in (131026, 131047):
            logger.info("24h window closed — falling back to hello_world template")
            template_payload = {
                "messaging_product": "whatsapp",
                "to": clean_number,
                "type": "template",
                "template": {
                    "name": "hello_world",
                    "language": {"code": "en_US"},
                },
            }
            with httpx.Client(timeout=10.0) as client:
                t_response = client.post(url, headers=headers, json=template_payload)
                t_data = t_response.json()

            if t_response.status_code == 200:
                msg_id = t_data.get("messages", [{}])[0].get("id", "")
                logger.info("WhatsApp template sent: ID=%s", msg_id)
                return {"success": True, "id": msg_id, "mode": "live_template"}
            else:
                t_err = t_data.get("error", {}).get("message", "Template send failed")
                logger.error("Template fallback failed: %s", t_err)
                return {"success": False, "id": "", "error": t_err, "mode": "failed"}

        logger.error("Meta WhatsApp send failed: %s", error_msg)
        return {"success": False, "id": "", "error": error_msg, "mode": "failed"}

    except Exception as exc:
        logger.error("WhatsApp Exception: %s", exc)
        return {"success": False, "id": "", "error": str(exc), "mode": "failed"}


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
