"""
Impact Prediction Engine — translates a DisruptionEvent into quantified
local business cost impacts using causal chain rules.
"""
from __future__ import annotations
import json
from pathlib import Path
from dataclasses import dataclass, field


_DATA_DIR = Path(__file__).parent.parent / "data"
_RULES_FILE = _DATA_DIR / "impact_rules.json"


def _load_rules() -> dict:
    with open(_RULES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


_RULES = _load_rules()


@dataclass
class BusinessImpact:
    event_id: str
    business_type: str
    commodities: list[str]
    cost_changes: dict[str, float]          # e.g. {"LPG": 0.20, "transport": 0.12}
    margin_change: float                     # overall margin impact (negative = bad)
    demand_change: float
    confidence_interval: float
    risk_level: str
    raw_summary: str = ""

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "business_type": self.business_type,
            "commodities": self.commodities,
            "cost_changes": {k: round(v, 4) for k, v in self.cost_changes.items()},
            "margin_change": round(self.margin_change, 4),
            "demand_change": round(self.demand_change, 4),
            "confidence_interval": self.confidence_interval,
            "risk_level": self.risk_level,
            "raw_summary": self.raw_summary,
        }


def predict_impact(event: dict, business_type: str = "kirana") -> BusinessImpact:
    """
    Calculate quantified business impact from a DisruptionEvent.

    Args:
        event: DisruptionEvent dict (from risk_agent.detect_risks).
        business_type: "kirana", "restaurant", or "pharma".

    Returns:
        BusinessImpact dataclass with cost changes, margin, and demand delta.
    """
    chains = _RULES["commodity_chains"]
    amplifiers = _RULES["risk_amplifiers"]
    sensitivity = _RULES["business_type_sensitivity"].get(business_type, {})

    risk_level = event.get("risk_level", "MEDIUM")
    amplifier = amplifiers.get(risk_level, 0.5)
    commodities: list[str] = event.get("commodities_affected", [])

    # ── Compute impact per commodity ──────────────────────────────────────────
    # Assume a base commodity price shock of 20% at HIGH risk
    BASE_SHOCK = 0.20

    total_transport_impact = 0.0
    total_margin_impact = 0.0
    total_demand_impact = 0.0
    cost_changes: dict[str, float] = {}

    for commodity in commodities:
        if commodity not in chains:
            continue
        rule = chains[commodity]
        biz_sensitivity = sensitivity.get(commodity, 1.0)
        effective_shock = BASE_SHOCK * amplifier * biz_sensitivity

        commodity_price_change = round(effective_shock, 4)
        transport_hit = rule["transport_multiplier"] * effective_shock
        margin_hit = rule["product_cost_multiplier"] * effective_shock
        demand_hit = rule["demand_elasticity"] * effective_shock

        cost_changes[commodity] = commodity_price_change
        total_transport_impact += transport_hit
        total_margin_impact -= margin_hit      # negative = margin compression
        total_demand_impact += demand_hit      # already negative from rules

    # Transport always affects margin
    if total_transport_impact > 0:
        cost_changes["transport"] = round(total_transport_impact, 4)
        total_margin_impact -= total_transport_impact * 0.5

    # ── Confidence interval: tighter for HIGH risk (more data), wider for LOW ─
    ci_map = {"HIGH": 0.03, "MEDIUM": 0.06, "LOW": 0.10}
    confidence_interval = ci_map.get(risk_level, 0.06)

    # ── Human-readable summary ────────────────────────────────────────────────
    top_commodity = max(cost_changes, key=cost_changes.get) if cost_changes else "N/A"
    summary = (
        f"Risk level {risk_level}: {top_commodity} expected to rise "
        f"{cost_changes.get(top_commodity, 0)*100:.1f}%. "
        f"Net margin impact: {total_margin_impact*100:.1f}%."
    )

    return BusinessImpact(
        event_id=event["id"],
        business_type=business_type,
        commodities=commodities,
        cost_changes=cost_changes,
        margin_change=round(total_margin_impact, 4),
        demand_change=round(total_demand_impact, 4),
        confidence_interval=confidence_interval,
        risk_level=risk_level,
        raw_summary=summary,
    )
