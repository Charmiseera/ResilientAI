"""
User profile management — stores onboarding data, decision logs, strategies, and learning data.
Migrated to Supabase (PostgreSQL).
"""
from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from engines.database import get_db

DEMO_USER_ID = "00000000-0000-0000-0000-000000000000"

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _resolve_user_id(user_id: str) -> str:
    """Map 'demo' to a valid UUID and ensure the demo user exists in DB to prevent FK constraint failures."""
    if user_id != "demo":
        return user_id

    db = get_db()
    if db is None:
        return DEMO_USER_ID
    existing = db.table("users").select("id").eq("id", DEMO_USER_ID).execute()
    if not existing.data:
        try:
            db.table("users").upsert({
                "id": DEMO_USER_ID,
                "name": "Demo User",
                "business_type": "kirana",
                "city": "Demo City",
                "phone": "demo",
                "lang": "en",
                "weekly_revenue_inr": 50000.0,
                "created_at": _now(),
                "updated_at": _now()
            }).execute()
        except Exception:
            pass
    return DEMO_USER_ID


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
    db = get_db()
    
    existing = db.table("users").select("*").eq("phone", phone).execute()
    
    if existing.data and len(existing.data) > 0:
        user_id = existing.data[0]["id"]
        created_at = existing.data[0]["created_at"]
    else:
        user_id = str(uuid.uuid4())
        created_at = _now()

    updated_at = _now()

    payload = {
        "id": user_id,
        "name": name,
        "business_type": business_type,
        "city": city,
        "phone": phone,
        "lang": lang,
        "weekly_revenue_inr": weekly_revenue,
        "created_at": created_at,
        "updated_at": updated_at
    }

    result = db.table("users").upsert(payload).execute()
    return result.data[0] if result.data else payload


def load_all_profiles() -> list[dict]:
    db = get_db()
    result = db.table("users").select("*").execute()
    return result.data if result.data else []


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
    db = get_db()
    user_id = _resolve_user_id(user_id)
    decision_id = str(uuid.uuid4())
    
    payload = {
        "id": decision_id,
        "user_id": user_id,
        "event_id": event_id,
        "business_type": business_type,
        "action_taken": action_taken,
        "profit_impact_inr": profit_impact_inr,
        "engine": engine,
        "timestamp": _now()
    }

    result = db.table("decisions").insert(payload).execute()
    return result.data[0] if result.data else payload


def load_decision_history(user_id: str = "demo") -> list[dict]:
    db = get_db()
    user_id = _resolve_user_id(user_id)
    result = db.table("decisions").select("*").eq("user_id", user_id).order("timestamp", desc=True).execute()
    return result.data if result.data else []


def save_decision_feedback(decision_id: str, feedback: str, outcome_rating: int) -> dict | None:
    """Patch an existing decision row with user outcome feedback and star rating."""
    db = get_db()
    try:
        result = db.table("decisions").update({
            "feedback":       feedback,
            "outcome_rating": outcome_rating,
            "feedback_at":    _now(),
        }).eq("id", decision_id).execute()
        return result.data[0] if result.data else None
    except Exception as exc:
        # Column may not exist yet — log and return None so the route raises 404
        import logging
        logging.getLogger(__name__).warning("save_decision_feedback failed: %s", exc)
        return None


# ── Profit Simulator Strategy Tracking ────────────────────────────────────────
def log_strategy_adoption(
    user_id: str,
    weekly_revenue: float,
    current_margin_pct: float,
    price_delta: float,
    extra_units: int,
    projected_profit: float,
    snapshot: dict
) -> dict:
    """Log a strategy adopted from the Profit Simulator."""
    db = get_db()
    user_id = _resolve_user_id(user_id)
    strategy_id = str(uuid.uuid4())
    snapshot_json = json.dumps(snapshot)
    
    payload = {
        "id": strategy_id,
        "user_id": user_id,
        "weekly_revenue": float(weekly_revenue),
        "current_margin_pct": float(current_margin_pct),
        "price_delta": float(price_delta),
        "extra_units": int(extra_units),
        "projected_profit": float(projected_profit),
        "snapshot_json": snapshot_json,
        "timestamp": _now()
    }
    
    result = db.table("adopted_strategies").insert(payload).execute()
    log_agent_learning(user_id, "strategy_adoption", snapshot_json, 0.9)
    
    return result.data[0] if result.data else payload

def load_strategy_history(user_id: str = "demo") -> list[dict]:
    db = get_db()
    user_id = _resolve_user_id(user_id)
    result = db.table("adopted_strategies").select("*").eq("user_id", user_id).order("timestamp", desc=True).execute()
    return result.data if result.data else []


# ── Session & Behavior Tracking ───────────────────────────────────────────────
def log_login_session(user_id: str = "demo") -> str:
    """Record a user session start."""
    db = get_db()
    user_id = _resolve_user_id(user_id)
    session_id = str(uuid.uuid4())
    
    payload = {
        "id": session_id,
        "user_id": user_id,
        "login_time": _now()
    }
    
    db.table("login_sessions").insert(payload).execute()
    return session_id


def log_agent_learning(user_id: str, behavior_type: str, pattern_data: str, confidence: float) -> str:
    """Store raw interaction data to train AI context later."""
    db = get_db()
    user_id = _resolve_user_id(user_id)
    learning_id = str(uuid.uuid4())
    
    try:
        if isinstance(pattern_data, str):
            parsed_data = json.loads(pattern_data)
        else:
            parsed_data = pattern_data
    except:
        parsed_data = {"raw": pattern_data}

    payload = {
        "id": learning_id,
        "user_id": user_id,
        "behavior_type": behavior_type,
        "pattern_data": parsed_data,
        "confidence_score": float(confidence),
        "timestamp": _now()
    }
    
    db.table("agent_learnings").insert(payload).execute()
    return learning_id


def get_user_behavior_summary(user_id: str = "demo") -> dict:
    """Get aggregated behavior stats for agent prediction prompts — including outcome feedback."""
    db = get_db()
    user_id = _resolve_user_id(user_id)

    decisions  = db.table("decisions").select(
        "profit_impact_inr, action_taken, feedback, outcome_rating"
    ).eq("user_id", user_id).execute()

    strategies = db.table("adopted_strategies").select("id").eq("user_id", user_id).execute()

    decisions_list  = decisions.data  if decisions.data  else []
    strategies_list = strategies.data if strategies.data else []

    cnt_decisions   = len(decisions_list)
    total_profit    = sum(d.get("profit_impact_inr", 0) for d in decisions_list)
    cnt_strategies  = len(strategies_list)

    # ── Feedback analytics ──────────────────────────────────────────────────
    rated = [d for d in decisions_list if d.get("outcome_rating")]
    avg_rating = round(sum(d["outcome_rating"] for d in rated) / len(rated), 2) if rated else None

    # Action-level aggregation: map action_taken → list of ratings
    action_ratings: dict[str, list[int]] = {}
    for d in rated:
        action = d.get("action_taken", "unknown")[:60]
        action_ratings.setdefault(action, []).append(d["outcome_rating"])

    # Best-performing action (highest mean rating, ≥2 datapoints preferred)
    best_action  = None
    worst_action = None
    if action_ratings:
        scored = {
            a: sum(rs) / len(rs)
            for a, rs in action_ratings.items()
        }
        best_action  = max(scored, key=scored.get)
        worst_action = min(scored, key=scored.get)

    # Recent feedback notes (last 3) — fed into AI prompts for qualitative context
    recent_feedback = [
        {"action": d.get("action_taken", "")[:80], "rating": d["outcome_rating"], "note": d.get("feedback", "")}
        for d in sorted(rated, key=lambda x: x.get("outcome_rating", 0), reverse=True)[:3]
    ]

    return {
        "user_id":                     user_id,
        "total_accepted_decisions":     cnt_decisions,
        "total_profit_gained_inr":      total_profit,
        "total_strategies_adopted":     cnt_strategies,
        # Feedback intelligence
        "avg_outcome_rating":           avg_rating,
        "total_rated_decisions":        len(rated),
        "best_performing_action":       best_action,
        "worst_performing_action":      worst_action,
        "recent_feedback":              recent_feedback,
    }

