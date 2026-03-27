"""POST /api/v1/impact — compute business impact from a disruption event."""
from fastapi import APIRouter, HTTPException
from agents.risk_agent import get_event_by_id, load_seed_events
from engines.impact_engine import predict_impact
from api.models import ImpactRequest, ImpactResponse

router = APIRouter()


@router.post("/impact", response_model=ImpactResponse)
def get_impact(req: ImpactRequest):
    """Translate a disruption event into quantified local business cost impacts."""
    event = get_event_by_id(req.event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{req.event_id}' not found.")

    impact = predict_impact(event, business_type=req.business_type)
    return impact.to_dict()
