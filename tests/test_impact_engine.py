"""Unit tests for the Impact Prediction Engine."""
import pytest
from agents.risk_agent import load_seed_events
from engines.impact_engine import predict_impact


def get_high_risk_event():
    events = load_seed_events()
    return next(e for e in events if e["risk_level"] == "HIGH")


class TestImpactEngine:
    def test_returns_impact_object(self):
        event = get_high_risk_event()
        impact = predict_impact(event, "kirana")
        assert impact is not None
        assert impact.event_id == event["id"]

    def test_high_risk_has_positive_cost_changes(self):
        event = get_high_risk_event()
        impact = predict_impact(event, "kirana")
        assert max(impact.cost_changes.values()) > 0

    def test_margin_change_negative_on_high_risk(self):
        event = get_high_risk_event()
        impact = predict_impact(event, "kirana")
        assert impact.margin_change < 0

    def test_confidence_interval_populated(self):
        event = get_high_risk_event()
        impact = predict_impact(event, "kirana")
        assert 0 < impact.confidence_interval <= 0.15

    def test_restaurant_sensitivity_higher_for_lpg(self):
        event = get_high_risk_event()
        kirana_impact = predict_impact(event, "kirana")
        restaurant_impact = predict_impact(event, "restaurant")
        # Restaurant is more sensitive to LPG (multiplier 1.8 vs 1.2)
        kirana_lpg = kirana_impact.cost_changes.get("LPG", 0)
        restaurant_lpg = restaurant_impact.cost_changes.get("LPG", 0)
        assert restaurant_lpg >= kirana_lpg

    def test_to_dict_has_all_keys(self):
        event = get_high_risk_event()
        d = predict_impact(event, "kirana").to_dict()
        for key in ["event_id", "cost_changes", "margin_change", "demand_change", "confidence_interval"]:
            assert key in d
