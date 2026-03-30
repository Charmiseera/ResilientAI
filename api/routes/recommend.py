"""POST /api/v1/recommend — optimize and return the best business decision.
Now feedback-aware: loads user's outcome history and passes it to the optimizer
so confidence scores reflect what actually worked for this specific user.
"""
from fastapi import APIRouter, HTTPException, Query
from agents.risk_agent import get_event_by_id
from engines.impact_engine import predict_impact
from engines.optimizer import optimize
from engines.user_store import get_user_behavior_summary
from api.models import RecommendRequest, RecommendResponse, AlternativeOption

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def get_recommendation(
    req: RecommendRequest,
    user_id: str = Query("demo", description="User ID — used to personalise confidence from past feedback"),
):
    """
    Run the quantum-inspired optimizer and return the best decision.

    When user_id is provided, the optimizer adjusts confidence scores
    using the user's real outcome ratings — actions they historically
    rated 4-5★ are boosted; poorly-rated actions are penalised.
    """
    event = get_event_by_id(req.event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{req.event_id}' not found.")

    impact = predict_impact(event, business_type=req.business_type)

    # Load user behavior summary (includes feedback analytics)
    try:
        behavior = get_user_behavior_summary(user_id)
    except Exception:
        behavior = None

    # Pass behavior context to optimizer — it adjusts option confidence from ratings
    result = optimize(impact.to_dict(), user_behavior=behavior)

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
