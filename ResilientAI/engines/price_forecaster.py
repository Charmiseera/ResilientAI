"""
Price Forecasting Engine
Predicts commodity prices for the next 7 days using:
  - Baseline prices from commodity_baselines.csv
  - Shock percentage from disruption event
  - Simple linear decay model (price shock fades over time)
"""
from __future__ import annotations
import csv
from dataclasses import dataclass, field
from pathlib import Path
import numpy as np

_BASELINES_FILE = Path(__file__).parent.parent / "data" / "commodity_baselines.csv"

# How fast the shock fades: 1.0 = instant, 0.0 = permanent
# Based on historical data: supply shocks typically peak at day 3–5, fade by week 3
_DECAY_RATE = 0.12  # ~12% daily fade


@dataclass
class PriceForecast:
    commodity: str
    unit: str
    baseline_price: float
    current_shock_pct: float      # e.g. 0.20 for 20% shock
    forecasted_prices: list[float] = field(default_factory=list)  # 7-day prices
    forecasted_dates: list[str] = field(default_factory=list)
    peak_day: int = 0
    peak_price: float = 0.0
    recovery_day: int = 14        # estimated days to recovery

    def to_dict(self) -> dict:
        return {
            "commodity": self.commodity,
            "unit": self.unit,
            "baseline_price": self.baseline_price,
            "current_shock_pct": self.current_shock_pct,
            "forecasted_prices": self.forecasted_prices,
            "forecasted_dates": self.forecasted_dates,
            "peak_day": self.peak_day,
            "peak_price": self.peak_price,
            "recovery_day": self.recovery_day,
        }


def _load_baselines() -> dict[str, dict]:
    """Load commodity baseline prices from CSV."""
    baselines: dict[str, dict] = {}
    if not _BASELINES_FILE.exists():
        return baselines
    with open(_BASELINES_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            baselines[row["commodity"]] = {
                "baseline_price": float(row["baseline_price_inr"]),
                "unit": row["unit"],
                "sector": row.get("category", "general"),
            }
    return baselines


def _shock_curve(shock_pct: float, days: int = 7) -> np.ndarray:
    """
    Model price shock as: starts at shock_pct, decays daily by _DECAY_RATE.
    Shock peaks at day 2 (amplified by 1.15x) then decays.
    """
    curve = np.zeros(days)
    for d in range(days):
        if d <= 2:
            # Amplification phase — markets overshoot
            amplitude = shock_pct * (1 + 0.15 * d / 2)
        else:
            # Decay phase
            amplitude = shock_pct * (1 + 0.15) * np.exp(-_DECAY_RATE * (d - 2))
        curve[d] = max(0, amplitude)
    return curve


def forecast(
    commodities: list[str],
    cost_changes: dict[str, float],
    days: int = 7,
) -> list[PriceForecast]:
    """
    Forecast prices for a list of commodities over N days.

    Args:
        commodities: List of commodity names (from DisruptionEvent)
        cost_changes: Mapping of commodity → shock fraction (e.g. {"LPG": 0.20})
        days: Number of days to forecast

    Returns:
        List of PriceForecast objects, one per commodity
    """
    from datetime import datetime, timedelta, timezone

    baselines = _load_baselines()
    forecasts: list[PriceForecast] = []
    today = datetime.now(timezone.utc).date()
    date_labels = [(today + timedelta(days=d)).strftime("%b %d") for d in range(days)]

    for commodity in commodities:
        shock_pct = cost_changes.get(commodity, 0.0)
        if shock_pct <= 0:
            continue

        baseline_info = baselines.get(commodity, {
            "baseline_price": 100.0, "unit": "unit"
        })
        baseline = baseline_info["baseline_price"]
        unit = baseline_info["unit"]

        shock_curve = _shock_curve(shock_pct, days)
        prices = [round(baseline * (1 + s), 2) for s in shock_curve]

        peak_idx = int(np.argmax(prices))
        recovery_day = max(14, int(1 / _DECAY_RATE) + 3)

        forecasts.append(PriceForecast(
            commodity=commodity,
            unit=unit,
            baseline_price=baseline,
            current_shock_pct=shock_pct,
            forecasted_prices=prices,
            forecasted_dates=date_labels,
            peak_day=peak_idx + 1,
            peak_price=prices[peak_idx],
            recovery_day=recovery_day,
        ))

    return forecasts
