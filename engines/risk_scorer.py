"""
Business-Aware Risk Scorer
Downgrades (or upgrades) a global event's risk level based on
how much the user's specific business type is actually affected.

A pharma store seeing a "Taiwan electronics blockade" rated HIGH globally
gets it downgraded to LOW because pharma has 0.4 sensitivity to electronics.

A restaurant seeing "Hormuz LPG crisis" stays HIGH because restaurants
have 1.8x sensitivity to LPG.
"""
from __future__ import annotations
import json
from pathlib import Path

_RULES_FILE = Path(__file__).parent.parent / "data" / "impact_rules.json"

# Thresholds: weighted_sensitivity → displayed risk level
_BIZ_RISK_THRESHOLDS = [
    (0.8, "HIGH"),
    (0.4, "MEDIUM"),
    (0.0, "LOW"),
]


def _load_sensitivity() -> dict:
    rules = json.loads(_RULES_FILE.read_text(encoding="utf-8"))
    return rules.get("business_type_sensitivity", {})


def compute_business_risk(
    event: dict,
    business_type: str,
) -> tuple[str, float, float]:
    """
    Returns (adjusted_risk_level, sensitivity_score, confidence_adjustment).

    sensitivity_score: 0.0 = not affected at all, 1.0+ = highly affected
    confidence_adjustment: modifier applied to raw event confidence
    """
    sensitivity_map = _load_sensitivity()
    biz_sensitivity = sensitivity_map.get(business_type, {})
    commodities = event.get("commodities_affected", [])

    if not commodities or not biz_sensitivity:
        return event.get("risk_level", "MEDIUM"), 0.5, 1.0

    # Compute weighted average sensitivity across all affected commodities
    scores = []
    for commodity in commodities:
        # Default sensitivity = 1.0 (equally affected) if not specified
        raw_score = biz_sensitivity.get(commodity, 1.0)
        scores.append(raw_score)

    if not scores:
        return event.get("risk_level", "MEDIUM"), 0.5, 1.0

    avg_sensitivity = sum(scores) / len(scores)

    # Global risk amplifier: HIGH=1.0, MEDIUM=0.5, LOW=0.1
    global_amplifiers = {"HIGH": 1.0, "MEDIUM": 0.5, "LOW": 0.1}
    global_amplifier = global_amplifiers.get(event.get("risk_level", "MEDIUM"), 0.5)

    # Effective business impact score
    effective_score = avg_sensitivity * global_amplifier

    # Map to risk level
    adjusted_risk = "LOW"
    for threshold, level in _BIZ_RISK_THRESHOLDS:
        if effective_score >= threshold:
            adjusted_risk = level
            break

    # Confidence: low sensitivity = lower confidence in relevance
    confidence_adj = min(1.0, event.get("confidence", 0.7) * min(1.0, avg_sensitivity))

    return adjusted_risk, round(avg_sensitivity, 3), round(confidence_adj, 3)


def enrich_event_for_business(event: dict, business_type: str) -> dict:
    """
    Return a copy of the event with business-adjusted fields:
      - business_risk_level: the adjusted risk for THIS business
      - business_sensitivity: 0-2.0 score
      - business_confidence: adjusted confidence
      - is_relevant: False if sensitivity < 0.2 (irrelevant to this business)
    """
    adjusted_risk, sensitivity, biz_confidence = compute_business_risk(event, business_type)

    return {
        **event,
        "business_risk_level": adjusted_risk,
        "business_sensitivity": sensitivity,
        "business_confidence": biz_confidence,
        "is_relevant": sensitivity >= 0.2,
    }
