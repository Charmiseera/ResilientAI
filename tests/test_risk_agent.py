"""Unit tests for the Risk Detection Agent."""
import pytest
from agents.nlp_classifier import classify
from agents.risk_agent import load_seed_events, get_event_by_id


class TestNLPClassifier:
    def test_high_risk_hormuz(self):
        result = classify("Strait of Hormuz closure threatens global LPG supply")
        assert result.risk_level == "HIGH"
        assert result.confidence >= 0.75
        assert "LPG" in result.commodities

    def test_high_risk_war(self):
        result = classify("War escalates in Middle East — crude oil supply at risk")
        assert result.risk_level == "HIGH"

    def test_medium_risk_delay(self):
        result = classify("Shipping delays reported at Singapore port causing uncertainty")
        assert result.risk_level in ("MEDIUM", "HIGH")

    def test_low_risk_neutral(self):
        result = classify("Quarterly earnings report shows steady growth")
        assert result.risk_level == "LOW"

    def test_commodity_detection(self):
        result = classify("Ukraine wheat export ban hits flour prices in India")
        assert "wheat" in result.commodities

    def test_region_hint_hormuz(self):
        result = classify("Tensions near Hormuz impact shipping routes")
        assert "LPG" in result.commodities or "crude_oil" in result.commodities


class TestRiskAgent:
    def test_seed_events_load(self):
        events = load_seed_events()
        assert len(events) >= 1
        assert "risk_level" in events[0]

    def test_get_event_by_id_found(self):
        event = get_event_by_id("evt_001")
        assert event is not None
        assert event["id"] == "evt_001"

    def test_get_event_by_id_not_found(self):
        event = get_event_by_id("nonexistent")
        assert event is None
