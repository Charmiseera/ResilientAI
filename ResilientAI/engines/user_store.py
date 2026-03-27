"""
User profile management — stores onboarding data and decision logs locally.
Uses JSON for portability; no database needed at MVP.
"""
from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

_DATA_DIR = Path(__file__).parent / "data"
_PROFILES_FILE = _DATA_DIR / "user_profiles.json"
_DECISIONS_FILE = _DATA_DIR / "decisions_log.json"


def _load_json(path: Path) -> list:
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── User Profiles ─────────────────────────────────────────────────────────────
def save_profile(
    name: str,
    business_type: str,
    city: str,
    phone: str = "",
    lang: str = "en",
    weekly_revenue: float = 50_000,
) -> dict:
    """Create or update a user profile."""
    profiles = _load_json(_PROFILES_FILE)

    # Upsert by phone number
    existing = next((p for p in profiles if p.get("phone") == phone), None)
    profile = {
        "id": existing.get("id") if existing else str(uuid.uuid4())[:8],
        "name": name,
        "business_type": business_type,
        "city": city,
        "phone": phone,
        "lang": lang,
        "weekly_revenue_inr": weekly_revenue,
        "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if existing:
        profiles = [profile if p.get("phone") == phone else p for p in profiles]
    else:
        profiles.append(profile)

    _save_json(_PROFILES_FILE, profiles)
    return profile


def load_all_profiles() -> list[dict]:
    return _load_json(_PROFILES_FILE)


# ── Decision Log ──────────────────────────────────────────────────────────────
def log_decision(
    event_id: str,
    business_type: str,
    action_taken: str,
    profit_impact_inr: float,
    engine: str,
    user_id: str = "demo",
) -> dict:
    """Log an accepted recommendation for audit trail."""
    decisions = _load_json(_DECISIONS_FILE)
    entry = {
        "id": str(uuid.uuid4())[:8],
        "user_id": user_id,
        "event_id": event_id,
        "business_type": business_type,
        "action_taken": action_taken,
        "profit_impact_inr": profit_impact_inr,
        "engine": engine,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    decisions.append(entry)
    _save_json(_DECISIONS_FILE, decisions)
    return entry


def load_decision_history(user_id: str = "demo") -> list[dict]:
    decisions = _load_json(_DECISIONS_FILE)
    return [d for d in decisions if d.get("user_id") == user_id]
