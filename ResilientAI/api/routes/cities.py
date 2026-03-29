"""POST /api/v1/cities — compare impact across Indian cities"""
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
    results = compare_cities(impact, cities, req.weekly_revenue)
    return [r.to_dict() for r in results]


@router.get("/cities/list")
def list_cities():
    return {"cities": ALL_CITIES}
