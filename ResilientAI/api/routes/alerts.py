"""GET /api/v1/alerts — return business-adjusted risk alerts."""
from fastapi import APIRouter, Query
from agents.risk_agent import detect_risks
from engines.risk_scorer import enrich_event_for_business

router = APIRouter()


@router.get("/alerts")
def get_alerts(
    min_risk: str = Query("MEDIUM", description="Minimum risk level: LOW | MEDIUM | HIGH"),
    business_type: str = Query("kirana", description="User's business type: kirana | restaurant | pharma"),
):
    """
    Return risk alerts, adjusted to the user's specific business type.
    A pharma store will see 'LOW' for an LPG crisis instead of 'HIGH'
    because pharma has low LPG sensitivity.
    Only returns alerts that are RELEVANT to this business type.
    """
    RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    min_order = RISK_ORDER.get(min_risk.upper(), 1)

    # Get all events (no global filter yet — we apply business filter below)
    all_events = detect_risks(min_risk="LOW")

    # Enrich each event with business-adjusted risk
    enriched = [enrich_event_for_business(e, business_type) for e in all_events]

    # Filter by: relevant to this business AND above min_risk threshold
    filtered = [
        e for e in enriched
        if e["is_relevant"]
        and RISK_ORDER.get(e["business_risk_level"], 0) >= min_order
    ]

    # Sort: business HIGH first
    return sorted(filtered, key=lambda e: RISK_ORDER.get(e["business_risk_level"], 0), reverse=True)
