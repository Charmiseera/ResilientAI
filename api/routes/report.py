"""POST /api/v1/report — generate CSV analysis report"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.risk_agent import get_event_by_id
from engines.impact_engine import predict_impact
from engines.optimizer import optimize
from engines.price_forecaster import forecast
from engines.report_generator import generate_csv_report
import io

router = APIRouter()


class ReportRequest(BaseModel):
    event_id: str
    business_type: str = "kirana"


@router.post("/report")
def get_report(req: ReportRequest):
    event = get_event_by_id(req.event_id)
    if not event:
        return {"error": "Event not found"}

    impact = predict_impact(event, req.business_type).to_dict()
    rec = optimize(impact).to_dict()
    forecasts = forecast(
        commodities=impact["commodities"],
        cost_changes=impact["cost_changes"],
    )
    csv_str = generate_csv_report(event, impact, rec, [f.to_dict() for f in forecasts], req.business_type)

    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=ResilientAI_Report_{req.event_id}_{req.business_type}.csv"
        },
    )
