"""POST /api/v1/impact — run impact engine for an event + business type"""
from fastapi import APIRouter, HTTPException
from api.models import ImpactRequest, ImpactResponse
from agents.risk_agent import get_event_by_id
from engines.impact_engine import predict_impact

router = APIRouter()


@router.post("/impact", response_model=ImpactResponse)
def get_impact(req: ImpactRequest):
    event = get_event_by_id(req.event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{req.event_id}' not found")
    impact = predict_impact(event, req.business_type)
    d = impact.to_dict()
    return ImpactResponse(
        event_id=d["event_id"],
        business_type=d["business_type"],
        commodities=d["commodities"],
        cost_changes=d["cost_changes"],
        margin_change=d["margin_change"],
        demand_change=d["demand_change"],
        confidence_interval=d["confidence_interval"],   # ← was missing!
        risk_level=d["risk_level"],
        raw_summary=d["raw_summary"],
    )
