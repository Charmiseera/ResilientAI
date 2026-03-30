"""
Report Generator — exports analysis as CSV or plain text summary.
Used for the "Download Report" button in the dashboard.
"""
from __future__ import annotations
import csv
import io
from datetime import datetime, timezone


def generate_csv_report(
    event: dict,
    impact: dict,
    recommendation: dict,
    forecasts: list[dict],
    business_type: str,
) -> str:
    """
    Generate a CSV string report of the full analysis.
    Returns the CSV content as a string (ready for st.download_button).
    """
    buf = io.StringIO()
    writer = csv.writer(buf)

    # Header
    writer.writerow(["ResilientAI Analysis Report"])
    writer.writerow(["Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")])
    writer.writerow(["Business Type", business_type.title()])
    writer.writerow([])

    # Event
    writer.writerow(["=== DISRUPTION EVENT ==="])
    writer.writerow(["Headline", event.get("headline", "")])
    writer.writerow(["Risk Level", event.get("risk_level", "")])
    writer.writerow(["Confidence", f"{int(event.get('confidence',0)*100)}%"])
    writer.writerow(["Source", event.get("source", "")])
    writer.writerow(["Date", event.get("published_at", "")[:10]])
    writer.writerow([])

    # Impact
    writer.writerow(["=== BUSINESS IMPACT ==="])
    writer.writerow(["Margin Change", f"{impact.get('margin_change',0)*100:+.1f}%"])
    writer.writerow(["Demand Change", f"{impact.get('demand_change',0)*100:+.1f}%"])
    writer.writerow([])
    writer.writerow(["Commodity", "Cost Change (%)"])
    for commodity, change in impact.get("cost_changes", {}).items():
        writer.writerow([commodity, f"{change*100:+.1f}%"])
    writer.writerow([])

    # Recommendation
    writer.writerow(["=== AI RECOMMENDATION ==="])
    writer.writerow(["Action", recommendation.get("recommended_action", "")])
    writer.writerow(["Description", recommendation.get("description", "")])
    writer.writerow(["Profit Impact (7-day)", f"INR {recommendation.get('profit_impact_inr',0):,.0f}"])
    writer.writerow(["Engine", recommendation.get("generated_by", "classical").title()])
    writer.writerow(["Confidence", f"{int(recommendation.get('confidence',0)*100)}%"])
    writer.writerow([])

    # Alternatives
    writer.writerow(["=== ALTERNATIVE OPTIONS ==="])
    writer.writerow(["Action", "Profit Impact (INR)", "Risk Score"])
    for alt in recommendation.get("alternatives", []):
        writer.writerow([
            alt["action"],
            f"{alt['profit_impact_inr']:,.0f}",
            f"{int(alt['risk_score']*100)}%",
        ])
    writer.writerow([])

    # Price Forecasts
    if forecasts:
        writer.writerow(["=== 7-DAY PRICE FORECAST ==="])
        writer.writerow(["Commodity", "Baseline (INR)", "Peak Price (INR)", "Peak Day", "Est. Recovery"])
        for fc in forecasts:
            writer.writerow([
                fc["commodity"],
                f"{fc['baseline_price']:,.2f}/{fc['unit']}",
                f"{fc['peak_price']:,.2f}/{fc['unit']}",
                f"Day {fc['peak_day']}",
                f"~{fc['recovery_day']} days",
            ])

    return buf.getvalue()


def generate_text_summary(event: dict, impact: dict, recommendation: dict) -> str:
    """Short plain-text summary for WhatsApp / voice."""
    risk = event.get("risk_level", "HIGH")
    action = recommendation.get("recommended_action", "")
    profit = recommendation.get("profit_impact_inr", 0)
    margin = impact.get("margin_change", 0) * 100

    return (
        f"⚠️ {risk} RISK ALERT\n"
        f"Event: {event.get('headline','')[:60]}\n"
        f"Margin Impact: {margin:+.1f}%\n"
        f"Recommended: {action}\n"
        f"Expected Profit Impact: +INR {profit:,.0f}/week"
    )
