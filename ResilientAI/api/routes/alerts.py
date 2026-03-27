"""GET /api/v1/alerts — return current active disruption alerts."""
from fastapi import APIRouter, Query
from agents.risk_agent import detect_risks
from api.models import DisruptionEvent

router = APIRouter()


@router.get("/alerts", response_model=list[DisruptionEvent])
def get_alerts(min_risk: str = Query("MEDIUM", description="Minimum risk level: LOW | MEDIUM | HIGH")):
    """Return all active risk alerts at or above the specified minimum risk level."""
    events = detect_risks(min_risk=min_risk)
    return events
