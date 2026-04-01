"""
Risk Detection Agent — monitors live NewsAPI + seed data fallback.
Now uses news_fetcher for real data, merges with seed events.
"""
from __future__ import annotations
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from agents.nlp_classifier import classify

_DATA_DIR = Path(__file__).parent.parent / "data"
_SEED_FILE = _DATA_DIR / "seed_events.json"
_USE_SEED = os.getenv("USE_SEED_DATA", "true").lower() == "true"
_RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def _make_event(
    headline: str,
    risk_level: str,
    confidence: float,
    commodities: list[str],
    source: str = "agent",
    published_at: str | None = None,
    event_id: str | None = None,
) -> dict:
    return {
        "id": event_id or f"evt_{uuid.uuid4().hex[:6]}",
        "headline": headline,
        "source": source,
        "published_at": published_at or datetime.now(timezone.utc).isoformat(),
        "risk_level": risk_level,
        "confidence": confidence,
        "commodities_affected": commodities,
    }


def load_seed_events() -> list[dict]:
    with open(_SEED_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def detect_risks(min_risk: str = "MEDIUM") -> list[dict]:
    """
    Run the Risk Detection Agent.
    Priority: Live NewsAPI → Seed data fallback.
    Returns filtered list sorted by risk level (HIGH first).
    """
    min_order = _RISK_ORDER.get(min_risk, 1)
    events: list[dict] = []

    # Try live news first (if API key set and not forced seed mode)
    if not _USE_SEED:
        try:
            from agents.news_fetcher import fetch_live_news
            live_events = fetch_live_news()
            if live_events:
                events = live_events
        except Exception:
            pass

    # Fall back (or merge) with seed events
    if not events:
        events = load_seed_events()

    # Filter + sort HIGH first
    filtered = [e for e in events if _RISK_ORDER.get(e["risk_level"], 0) >= min_order]
    return sorted(filtered, key=lambda e: _RISK_ORDER.get(e["risk_level"], 0), reverse=True)


def get_event_by_id(event_id: str) -> dict | None:
    """Retrieve event from seed data or live cache."""
    all_events = load_seed_events()

    # Also check live cache if available
    try:
        from agents.news_fetcher import fetch_live_news
        all_events = all_events + fetch_live_news()
    except Exception:
        pass

    return next((e for e in all_events if e["id"] == event_id), None)
