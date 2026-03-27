"""POST /api/v1/voice — accept text query and return text + base64 audio."""
from __future__ import annotations
import base64
import io
from fastapi import APIRouter
from api.models import VoiceRequest, VoiceResponse

router = APIRouter()

# Simple intent → response map (no LLM needed for demo)
_RESPONSES = {
    "en": {
        "gas": "Yes, LPG price is expected to rise by 20% due to global disruption. Stock extra units and raise price by ₹2.",
        "price": "Our recommendation: raise your price by ₹2 to offset cost increase. Expected profit impact: +₹1,200 per week.",
        "stock": "Stock 10 extra units of your top-selling items before prices rise.",
        "risk": "Current risk level is HIGH. Strait of Hormuz disruption may affect LPG and transport costs.",
        "default": "There is a HIGH risk supply disruption detected. Check the dashboard for details.",
    },
    "hi": {
        "gas": "Haan, LPG price 20% badhega. 10 unit extra stock karo aur price ₹2 badhao.",
        "price": "Hamari recommendation: price ₹2 badhao. Expected profit: +₹1,200 per week.",
        "stock": "Abhi 10 unit extra kharido, price badhne se pehle.",
        "risk": "HIGH risk hai. Hormuz disruption se LPG aur transport cost badh sakta hai.",
        "default": "HIGH risk supply disruption hai. Dashboard dekho details ke liye.",
    },
}


def _match_intent(query: str, lang: str) -> str:
    q = query.lower()
    responses = _RESPONSES.get(lang, _RESPONSES["en"])
    for keyword in ["gas", "price", "stock", "risk"]:
        if keyword in q:
            return responses[keyword]
    return responses["default"]


def _text_to_audio_base64(text: str, lang: str) -> str:
    """Convert text to MP3 audio using gTTS and return as base64 string."""
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")
    except Exception:
        return ""


@router.post("/voice", response_model=VoiceResponse)
def voice_query(req: VoiceRequest):
    """Process a voice/text query and return a plain-language response with audio."""
    text_response = _match_intent(req.query, req.lang)
    audio_b64 = _text_to_audio_base64(text_response, lang=req.lang)
    return VoiceResponse(text_response=text_response, audio_base64=audio_b64)
