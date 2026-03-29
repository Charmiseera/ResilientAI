"""POST /api/v1/whatsapp/send — send a WhatsApp alert via Meta Cloud API"""
from fastapi import APIRouter
from pydantic import BaseModel
from voice.whatsapp import broadcast_alert

router = APIRouter()


class WhatsAppRequest(BaseModel):
    phone: str
    event_headline: str
    risk_level: str
    recommendation: str
    profit_inr: float
    lang: str = "en"


@router.post("/whatsapp/send")
def send_whatsapp(req: WhatsAppRequest):
    results = broadcast_alert(
        event={"headline": req.event_headline, "risk_level": req.risk_level},
        recommendation=req.recommendation,
        profit_inr=req.profit_inr,
        phone_numbers=[req.phone],
        lang=req.lang,
    )
    return results[0] if results else {"success": False, "error": "No numbers provided"}
