"""
Live News Fetcher — fetches real supply chain disruption news from NewsAPI.
Falls back to seed data if no API key or network failure.
"""
from __future__ import annotations
import os
import json
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

logger = logging.getLogger(__name__)

_NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
_CACHE_FILE = Path(__file__).parent.parent / "data" / "news_cache.json"
_CACHE_TTL_MINUTES = 30

# Keywords that indicate supply chain disruptions
_QUERY = (
    "(supply chain OR commodity OR shipping OR LPG OR crude oil OR wheat OR "
    "inflation OR port OR Hormuz OR Suez OR sanctions) AND "
    "(disruption OR shortage OR crisis OR blockade OR strike OR delay)"
)


def _load_cache() -> list[dict]:
    if not _CACHE_FILE.exists():
        return []
    try:
        data = json.loads(_CACHE_FILE.read_text(encoding="utf-8"))
        cached_at = datetime.fromisoformat(data.get("cached_at", "2000-01-01T00:00:00+00:00"))
        if datetime.now(timezone.utc) - cached_at < timedelta(minutes=_CACHE_TTL_MINUTES):
            return data.get("articles", [])
    except Exception:
        pass
    return []


def _save_cache(articles: list[dict]) -> None:
    _CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _CACHE_FILE.write_text(
        json.dumps({"cached_at": datetime.now(timezone.utc).isoformat(), "articles": articles},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _make_event_id(url: str) -> str:
    return "live_" + hashlib.md5(url.encode()).hexdigest()[:8]


def _classify_risk(title: str, description: str) -> tuple[str, float]:
    text = f"{title} {description}".lower()
    high_kw = ["closure", "blockade", "war", "crisis", "ban", "sanctions", "shutdown", "attack"]
    medium_kw = ["delay", "shortage", "strike", "disruption", "tension", "risk", "surge", "spike"]
    if any(k in text for k in high_kw):
        return "HIGH", 0.85
    if any(k in text for k in medium_kw):
        return "MEDIUM", 0.70
    return "LOW", 0.55


def _detect_commodities(text: str) -> list[str]:
    text = text.lower()
    mapping = {
        "LPG": ["lpg", "gas", "petroleum gas"],
        "crude_oil": ["crude", "oil", "petroleum"],
        "wheat": ["wheat", "flour", "grain"],
        "diesel": ["diesel", "fuel"],
        "edible_oil": ["edible oil", "palm oil", "sunflower"],
        "transport": ["shipping", "freight", "transport", "port", "vessel"],
    }
    found = [commodity for commodity, keywords in mapping.items()
             if any(k in text for k in keywords)]
    return found or ["general"]


def fetch_live_news() -> list[dict]:
    """
    Fetch live news from NewsAPI. Returns list of DisruptionEvent dicts.
    Returns empty list if API key not set or request fails.
    """
    if not _NEWS_API_KEY:
        logger.info("No NEWS_API_KEY set — skipping live fetch")
        return []

    cached = _load_cache()
    if cached:
        logger.info("Returning %d cached news articles", len(cached))
        return cached

    try:
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": _QUERY,
                "sortBy": "publishedAt",
                "language": "en",
                "pageSize": 10,
                "from": (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d"),
            },
            headers={"X-Api-Key": _NEWS_API_KEY},
            timeout=8,
        )
        resp.raise_for_status()
        articles = resp.json().get("articles", [])

        events = []
        for art in articles:
            title = art.get("title") or ""
            description = art.get("description") or ""
            risk_level, confidence = _classify_risk(title, description)
            commodities = _detect_commodities(f"{title} {description}")

            events.append({
                "id": _make_event_id(art.get("url", title)),
                "headline": title[:120],
                "source": art.get("source", {}).get("name", "NewsAPI"),
                "published_at": art.get("publishedAt", datetime.now(timezone.utc).isoformat()),
                "risk_level": risk_level,
                "confidence": confidence,
                "commodities_affected": commodities,
                "url": art.get("url", ""),
            })

        _save_cache(events)
        logger.info("Fetched %d live news events", len(events))
        return events

    except Exception as exc:
        logger.warning("Live news fetch failed: %s", exc)
        return []
