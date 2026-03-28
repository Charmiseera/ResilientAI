"""
POST /api/v1/voice
- Fetches live news context (NewsAPI or seed fallback)
- Sends query + news to Nebius Kimi-K2.5 (OpenAI-compatible)
- Falls back to Gemini if Nebius key is missing
- Returns text response + base64 MP3 audio (gTTS)
"""
from __future__ import annotations
import os
import base64
import io
import logging

from fastapi import APIRouter
from api.models import VoiceRequest, VoiceResponse
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

_NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY", "")
_NEBIUS_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1/"
_KIMI_MODEL = "moonshotai/Kimi-K2.5-fast"


def _get_news_context() -> str:
    """Fetch live news headlines; fall back to seed data. Returns compact text."""
    try:
        from agents.news_fetcher import fetch_live_news
        events = fetch_live_news()
        if events:
            lines = [
                f"- [{e['risk_level']}] {e['headline']} "
                f"(source: {e['source']}, commodities: {', '.join(e.get('commodities_affected', []))})"
                for e in events[:8]
            ]
            return "LIVE NEWS:\n" + "\n".join(lines)
    except Exception as exc:
        logger.warning("Live news fetch failed: %s", exc)

    try:
        from agents.risk_agent import load_seed_events
        events = load_seed_events()
        lines = [
            f"- [{e['risk_level']}] {e['headline']} "
            f"(commodities: {', '.join(e.get('commodities_affected', []))})"
            for e in events[:5]
        ]
        return "SEED NEWS (live API unavailable):\n" + "\n".join(lines)
    except Exception as exc:
        logger.warning("Seed fallback failed: %s", exc)
        return "No news context available."


def _detect_lang(text: str, fallback: str = "en") -> str:
    """Auto-detect language from query text. Returns 'hi', 'en', etc."""
    try:
        from langdetect import detect
        detected = detect(text)
        # Map common codes
        if detected in ("hi", "mr", "ne"):   # Hindi / Marathi / Nepali (Devanagari)
            return "hi"
        return detected[:2]  # e.g. 'en', 'ta', 'te', 'kn'
    except Exception:
        return fallback


def _build_prompt(query: str, lang: str, news_context: str) -> tuple[str, str]:
    """Return (system_prompt, user_message). Auto-detects query language."""
    # Auto-detect from actual query — overrides the sidebar lang if different
    detected = _detect_lang(query, fallback=lang)

    if detected == "hi":
        lang_instr = (
            "The user is writing/speaking in Hindi. "
            "You MUST respond ONLY in simple Hindi or Hinglish. Max 3 sentences."
        )
        tts_lang = "hi"
    elif detected == "ta":
        lang_instr = "The user is writing in Tamil. Respond in simple Tamil. Max 3 sentences."
        tts_lang = "ta"
    elif detected == "te":
        lang_instr = "The user is writing in Telugu. Respond in simple Telugu. Max 3 sentences."
        tts_lang = "te"
    else:
        lang_instr = "The user is writing in English. Respond in simple English. Max 3 sentences."
        tts_lang = "en"

    system_prompt = (
        f"You are ResilientAI, an AI supply chain advisor for small Indian MSME businesses "
        f"(kirana stores, restaurants, pharmacies).\n"
        f"{lang_instr}\n\n"
        f"Answer ONLY based on the news context provided. "
        f"Mention specific commodities, % changes, or risks if they appear in the news. "
        f"Do NOT make up numbers. If the news doesn't cover the topic, say so honestly.\n\n"
        f"Current supply chain news:\n{news_context}"
    )
    return system_prompt, query, tts_lang



def _ask_kimi(query: str, lang: str, news_context: str) -> tuple[str, str]:
    """Call Nebius Kimi-K2.5 via OpenAI-compatible SDK. Returns (reply, tts_lang)."""
    from openai import OpenAI
    client = OpenAI(
        base_url=_NEBIUS_BASE_URL,
        api_key=_NEBIUS_API_KEY,
    )
    system_prompt, user_message, tts_lang = _build_prompt(query, lang, news_context)
    response = client.chat.completions.create(
        model=_KIMI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": [{"type": "text", "text": user_message}]},
        ],
    )
    return response.choices[0].message.content.strip(), tts_lang


def _ask_gemini(query: str, lang: str, news_context: str) -> tuple[str, str]:
    """Fallback: call Gemini 1.5 Flash. Returns (reply, tts_lang)."""
    import google.generativeai as genai
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key:
        raise RuntimeError("No GEMINI_API_KEY set either.")
    genai.configure(api_key=gemini_key)
    system_prompt, user_message, tts_lang = _build_prompt(query, lang, news_context)
    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content(f"{system_prompt}\n\nUser: {user_message}")
    return resp.text.strip(), tts_lang


def _ask_ai(query: str, lang: str, news_context: str) -> tuple[str, str]:
    """Route to Kimi (Nebius) if key present, otherwise Gemini. Returns (reply, tts_lang)."""
    if _NEBIUS_API_KEY and _NEBIUS_API_KEY != "your_nebius_api_key_here":
        try:
            logger.info("Using Kimi-K2.5 via Nebius")
            return _ask_kimi(query, lang, news_context)
        except Exception as exc:
            logger.warning("Kimi call failed (%s) — falling back to Gemini", exc)

    logger.info("Using Gemini 1.5 Flash fallback")
    return _ask_gemini(query, lang, news_context)


def _text_to_audio_base64(text: str, lang: str) -> str:
    """Convert text to MP3 via gTTS, return base64 string."""
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")
    except Exception as exc:
        logger.warning("gTTS failed: %s", exc)
        return ""


@router.post("/voice", response_model=VoiceResponse)
def voice_query(req: VoiceRequest):
    """
    Accept a user text query, ground it in live news, and return an
    AI-generated response (Kimi-K2.5 via Nebius or Gemini fallback)
    with base64 MP3 audio in the auto-detected query language.
    """
    news_context = _get_news_context()
    text_response, tts_lang = _ask_ai(req.query, req.lang, news_context)
    # Use auto-detected language for TTS, not just sidebar setting
    audio_b64 = _text_to_audio_base64(text_response, lang=tts_lang)
    return VoiceResponse(text_response=text_response, audio_base64=audio_b64)
