"""Unit tests for the Optimizer — tests both quantum and classical paths."""
import pytest
import os

from agents.risk_agent import load_seed_events
from engines.impact_engine import predict_impact
from engines.optimizer import optimize, _classical_optimize, _build_options


def get_impact_dict():
    events = load_seed_events()
    event = next(e for e in events if e["risk_level"] == "HIGH")
    return predict_impact(event, "kirana").to_dict()


class TestOptimizer:
    def test_returns_result(self):
        result = optimize(get_impact_dict())
        assert result is not None

    def test_recommended_action_not_empty(self):
        result = optimize(get_impact_dict())
        assert result.recommended.action != ""

    def test_at_least_two_alternatives(self):
        result = optimize(get_impact_dict())
        assert len(result.alternatives) >= 2

    def test_profit_impact_positive(self):
        result = optimize(get_impact_dict())
        assert result.recommended.profit_impact_inr > 0

    def test_generated_by_is_valid_engine(self):
        """Accept either quantum or classical — both are valid."""
        result = optimize(get_impact_dict())
        assert result.generated_by in ("quantum", "classical")

    def test_to_dict_has_all_fields(self):
        result = optimize(get_impact_dict())
        d = result.to_dict()
        for key in ["recommended_action", "profit_impact_inr", "generated_by", "reason", "alternatives"]:
            assert key in d

    def test_classical_fallback_works_directly(self):
        """Classical optimizer always works independently."""
        impact = get_impact_dict()
        options = _build_options(impact)
        best = _classical_optimize(options)
        assert best.profit_impact_inr > 0
        assert best.action != ""
        assert 0.0 <= best.risk_score <= 1.0
