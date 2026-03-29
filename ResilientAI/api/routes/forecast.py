"""POST /api/v1/forecast — 7-day price forecast for event commodities"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.risk_agent import get_event_by_id
from engines.impact_engine import predict_impact
from engines.price_forecaster import forecast

router = APIRouter()


class ForecastRequest(BaseModel):
    event_id: str
    business_type: str = "kirana"


@router.post("/forecast")
def get_forecast(req: ForecastRequest):
    event = get_event_by_id(req.event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{req.event_id}' not found")
    impact = predict_impact(event, req.business_type).to_dict()
    forecasts = forecast(
        commodities=impact["commodities"],
        cost_changes=impact["cost_changes"],
    )
    return [f.to_dict() for f in forecasts]
