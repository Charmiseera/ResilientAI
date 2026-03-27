"""POST /api/v1/simulate — run a profit simulation for a proposed action."""
from fastapi import APIRouter
from api.models import SimulateRequest, SimulateResponse

router = APIRouter()


@router.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    """
    Simulate the projected profit impact of a specific business action.
    Simplified linear model: good enough for hackathon demo.
    """
    revenue = req.current_weekly_revenue_inr
    base_profit = revenue * req.current_margin_pct

    # Estimate revenue change from price delta
    # Assume price delta +₹2 on avg product of ₹50 → +4% revenue, -3% demand
    price_revenue_delta = req.price_delta_inr / 50.0 * revenue * 0.97

    # Estimate profit from extra units (at current margin)
    extra_unit_value = req.extra_units * 50 * req.current_margin_pct

    projected_revenue = revenue + price_revenue_delta
    projected_profit = base_profit + price_revenue_delta * req.current_margin_pct + extra_unit_value
    projected_margin = projected_profit / projected_revenue if projected_revenue else 0
    delta = projected_profit - base_profit

    return SimulateResponse(
        action=req.action,
        projected_weekly_revenue_inr=round(projected_revenue, 2),
        projected_weekly_profit_inr=round(projected_profit, 2),
        projected_margin_pct=round(projected_margin, 4),
        vs_baseline_profit_delta_inr=round(delta, 2),
    )
