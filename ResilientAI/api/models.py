"""Pydantic request/response models for the FastAPI layer."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal


# ── Shared ────────────────────────────────────────────────────────────────────
class DisruptionEvent(BaseModel):
    id: str
    headline: str
    source: str
    published_at: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    confidence: float = Field(ge=0.0, le=1.0)
    commodities_affected: list[str]


# ── /impact ───────────────────────────────────────────────────────────────────
class ImpactRequest(BaseModel):
    event_id: str
    business_type: Literal["kirana", "restaurant", "pharma"] = "kirana"


class ImpactResponse(BaseModel):
    event_id: str
    business_type: str
    commodities: list[str]
    cost_changes: dict[str, float]
    margin_change: float
    demand_change: float
    confidence_interval: float
    risk_level: str
    raw_summary: str


# ── /recommend ────────────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    event_id: str
    business_type: Literal["kirana", "restaurant", "pharma"] = "kirana"


class AlternativeOption(BaseModel):
    action: str
    profit_impact_inr: float
    risk_score: float


class RecommendResponse(BaseModel):
    recommended_action: str
    description: str
    profit_impact_inr: float
    reason: str
    generated_by: Literal["quantum", "classical"]
    confidence: float
    alternatives: list[AlternativeOption]


# ── /simulate ─────────────────────────────────────────────────────────────────
class SimulateRequest(BaseModel):
    action: str
    price_delta_inr: float = 0.0
    extra_units: int = 0
    current_weekly_revenue_inr: float = 50_000
    current_margin_pct: float = 0.15


class SimulateResponse(BaseModel):
    action: str
    projected_weekly_revenue_inr: float
    projected_weekly_profit_inr: float
    projected_margin_pct: float
    vs_baseline_profit_delta_inr: float


# ── /voice ────────────────────────────────────────────────────────────────────
class VoiceRequest(BaseModel):
    query: str
    lang: Literal["en", "hi"] = "en"


class VoiceResponse(BaseModel):
    text_response: str
    audio_base64: str = ""
