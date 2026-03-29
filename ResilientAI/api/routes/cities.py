"""POST /api/v1/cities — compare impact across Indian cities using AI"""
from fastapi import APIRouter
from pydantic import BaseModel
from agents.risk_agent import get_event_by_id
from engines.impact_engine import predict_impact
from engines.city_impact import compare_cities, ALL_CITIES

router = APIRouter()


class CityCompareRequest(BaseModel):
    event_id: str = "evt_001"
    business_type: str = "kirana"
    cities: list[str] | None = None
    weekly_revenue: float = 50000


@router.post("/cities")
def get_city_comparison(req: CityCompareRequest):
    cities = req.cities or ALL_CITIES
    event = get_event_by_id(req.event_id)
    if not event:
        return []

    impact = predict_impact(event, req.business_type).to_dict()

    # Build rich event context for Gemini city analysis
    event_context = (
        f"Event: {event.get('headline', 'Supply disruption')}\n"
        f"Risk Level: {event.get('risk_level', 'HIGH')}\n"
        f"Affected Commodities: {', '.join(event.get('commodities_affected', []))}\n"
        f"Description: {event.get('description', '')}\n"
        f"Expected margin impact (national average): {impact.get('margin_change', 0)*100:.1f}%\n"
        f"Expected demand impact: {impact.get('demand_change', 0)*100:.1f}%"
    )

    results = compare_cities(impact, cities, req.weekly_revenue, event_context)
    return [r.to_dict() for r in results]


@router.get("/cities/list")
def list_cities():
    return {"cities": ALL_CITIES}
