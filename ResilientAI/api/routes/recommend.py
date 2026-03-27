"""POST /api/v1/recommend — optimize and return the best business decision."""
from fastapi import APIRouter, HTTPException
from agents.risk_agent import get_event_by_id
from engines.impact_engine import predict_impact
from engines.optimizer import optimize
from api.models import RecommendRequest, RecommendResponse, AlternativeOption

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def get_recommendation(req: RecommendRequest):
    """Run the quantum-inspired optimizer and return the best decision."""
    event = get_event_by_id(req.event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{req.event_id}' not found.")

    impact = predict_impact(event, business_type=req.business_type)
    result = optimize(impact.to_dict())

    return RecommendResponse(
        recommended_action=result.recommended.action,
        description=result.recommended.description,
        profit_impact_inr=result.recommended.profit_impact_inr,
        reason=result.reason,
        generated_by=result.generated_by,
        confidence=result.recommended.confidence,
        alternatives=[
            AlternativeOption(
                action=a.action,
                profit_impact_inr=a.profit_impact_inr,
                risk_score=a.risk_score,
            )
            for a in result.alternatives
        ],
    )
