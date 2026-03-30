"""POST /api/v1/decisions — endpoints for tracking decisions, strategies, and behavior."""
from fastapi import APIRouter, HTTPException
from api.models import (
    DecisionRequest, DecisionResponse, FeedbackRequest,
    StrategyRequest, StrategyResponse, BehaviorSummaryResponse
)
from engines.user_store import (
    log_decision, load_decision_history, save_decision_feedback,
    log_strategy_adoption, load_strategy_history, get_user_behavior_summary
)

router = APIRouter()

@router.post("/decisions", response_model=DecisionResponse)
def add_decision(req: DecisionRequest):
    """Log an accepted decision from the user."""
    result = log_decision(
        event_id=req.event_id,
        business_type=req.business_type,
        action_taken=req.action_taken,
        profit_impact_inr=req.profit_impact_inr,
        engine=req.engine,
        user_id=req.user_id
    )
    return DecisionResponse(**result)

@router.get("/decisions/{user_id}", response_model=list[DecisionResponse])
def get_decisions(user_id: str):
    """Get decision history for a user."""
    history = load_decision_history(user_id)
    return [DecisionResponse(**d) for d in history]


@router.patch("/decisions/{decision_id}/feedback", response_model=DecisionResponse)
def submit_feedback(decision_id: str, req: FeedbackRequest):
    """Save user outcome feedback + star rating for an executed decision."""
    result = save_decision_feedback(
        decision_id=decision_id,
        feedback=req.feedback,
        outcome_rating=req.outcome_rating,
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"Decision '{decision_id}' not found.")
    return DecisionResponse(**result)

@router.post("/strategies", response_model=StrategyResponse)
def add_strategy(req: StrategyRequest):
    """Log a strategy adopted from the Profit Simulator."""
    result = log_strategy_adoption(
        user_id=req.user_id,
        weekly_revenue=req.weekly_revenue,
        current_margin_pct=req.current_margin_pct,
        price_delta=req.price_delta,
        extra_units=req.extra_units,
        projected_profit=req.projected_profit,
        snapshot=req.snapshot
    )
    return StrategyResponse(**result)

@router.get("/strategies/{user_id}", response_model=list[StrategyResponse])
def get_strategies(user_id: str):
    """Get strategy adoption history for a user."""
    history = load_strategy_history(user_id)
    return [StrategyResponse(**s) for s in history]

@router.get("/behavior/{user_id}", response_model=BehaviorSummaryResponse)
def get_behavior_summary(user_id: str):
    """Get aggregated behavior stats for agent pattern learning."""
    summary = get_user_behavior_summary(user_id)
    return BehaviorSummaryResponse(**summary)
