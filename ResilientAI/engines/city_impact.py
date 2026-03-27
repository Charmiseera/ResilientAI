"""
Multi-City Impact Adjuster
Adjusts commodity prices and demand based on Indian city tier.
Tier 1 (Mumbai, Delhi) = higher baseline prices, faster shock absorption.
Tier 2 (Nagpur, Pune) = moderate prices.
Tier 3 (Rural) = lower base but slower shock recovery.
"""
from __future__ import annotations
from dataclasses import dataclass

# Price multipliers relative to national average
_CITY_CONFIG: dict[str, dict] = {
    # ── Tier 1 ──────────────────────────────────────────────────────────────
    "Mumbai": {
        "tier": 1, "price_multiplier": 1.18, "demand_multiplier": 1.25,
        "shock_absorption": 0.85,   # absorbs shocks faster (larger market)
        "state": "Maharashtra",
    },
    "Delhi": {
        "tier": 1, "price_multiplier": 1.15, "demand_multiplier": 1.20,
        "shock_absorption": 0.80,
        "state": "Delhi",
    },
    "Bangalore": {
        "tier": 1, "price_multiplier": 1.12, "demand_multiplier": 1.15,
        "shock_absorption": 0.82,
        "state": "Karnataka",
    },
    "Chennai": {
        "tier": 1, "price_multiplier": 1.10, "demand_multiplier": 1.10,
        "shock_absorption": 0.83,
        "state": "Tamil Nadu",
    },
    # ── Tier 2 ──────────────────────────────────────────────────────────────
    "Nagpur": {
        "tier": 2, "price_multiplier": 1.00, "demand_multiplier": 1.00,
        "shock_absorption": 1.00,
        "state": "Maharashtra",
    },
    "Pune": {
        "tier": 2, "price_multiplier": 1.08, "demand_multiplier": 1.05,
        "shock_absorption": 0.92,
        "state": "Maharashtra",
    },
    "Jaipur": {
        "tier": 2, "price_multiplier": 0.95, "demand_multiplier": 0.95,
        "shock_absorption": 1.05,
        "state": "Rajasthan",
    },
    "Lucknow": {
        "tier": 2, "price_multiplier": 0.93, "demand_multiplier": 0.90,
        "shock_absorption": 1.08,
        "state": "Uttar Pradesh",
    },
    "Surat": {
        "tier": 2, "price_multiplier": 1.02, "demand_multiplier": 1.02,
        "shock_absorption": 0.95,
        "state": "Gujarat",
    },
    # ── Tier 3 ──────────────────────────────────────────────────────────────
    "Rural Maharashtra": {
        "tier": 3, "price_multiplier": 0.82, "demand_multiplier": 0.70,
        "shock_absorption": 1.25,  # slower recovery (fewer suppliers)
        "state": "Maharashtra",
    },
    "Rural UP": {
        "tier": 3, "price_multiplier": 0.78, "demand_multiplier": 0.65,
        "shock_absorption": 1.30,
        "state": "Uttar Pradesh",
    },
    "Rural Bihar": {
        "tier": 3, "price_multiplier": 0.75, "demand_multiplier": 0.60,
        "shock_absorption": 1.35,
        "state": "Bihar",
    },
}

ALL_CITIES = list(_CITY_CONFIG.keys())
TIER_1_CITIES = [c for c, d in _CITY_CONFIG.items() if d["tier"] == 1]
TIER_2_CITIES = [c for c, d in _CITY_CONFIG.items() if d["tier"] == 2]
TIER_3_CITIES = [c for c, d in _CITY_CONFIG.items() if d["tier"] == 3]


@dataclass
class CityImpact:
    city: str
    tier: int
    state: str
    adjusted_margin_change: float
    adjusted_demand_change: float
    adjusted_cost_changes: dict[str, float]
    adjusted_profit_inr: float
    price_multiplier: float
    shock_absorption: float

    def to_dict(self) -> dict:
        return {
            "city": self.city,
            "tier": self.tier,
            "state": self.state,
            "adjusted_margin_change": self.adjusted_margin_change,
            "adjusted_demand_change": self.adjusted_demand_change,
            "adjusted_cost_changes": self.adjusted_cost_changes,
            "adjusted_profit_inr": self.adjusted_profit_inr,
            "price_multiplier": self.price_multiplier,
            "shock_absorption": self.shock_absorption,
        }


def get_city_config(city: str) -> dict:
    return _CITY_CONFIG.get(city, _CITY_CONFIG["Nagpur"])


def adjust_impact_for_city(
    impact: dict,
    city: str,
    base_weekly_revenue: float = 50_000,
) -> CityImpact:
    """
    Adjust national average impact values for a specific city.

    Args:
        impact: Impact dict from ImpactEngine.to_dict()
        city: City name (must be in ALL_CITIES)
        base_weekly_revenue: Base weekly revenue before city adjustment

    Returns:
        CityImpact with city-specific figures
    """
    cfg = get_city_config(city)
    pm = cfg["price_multiplier"]
    dm = cfg["demand_multiplier"]
    sa = cfg["shock_absorption"]

    # City-adjusted margin: higher base revenue but shock absorbed differently
    margin_change = impact.get("margin_change", -0.08) * sa * (1 / pm)
    demand_change = impact.get("demand_change", -0.05) * dm

    # Adjusted cost changes
    cost_changes = {
        k: round(v * sa, 4)
        for k, v in impact.get("cost_changes", {}).items()
    }

    # Profit adjusted for city revenue levels
    city_revenue = base_weekly_revenue * pm * dm
    base_profit = city_revenue * 0.15
    profit_inr = round(base_profit * (1 + abs(margin_change) * 0.8), 0)

    return CityImpact(
        city=city,
        tier=cfg["tier"],
        state=cfg["state"],
        adjusted_margin_change=round(margin_change, 4),
        adjusted_demand_change=round(demand_change, 4),
        adjusted_cost_changes=cost_changes,
        adjusted_profit_inr=profit_inr,
        price_multiplier=pm,
        shock_absorption=sa,
    )


def compare_cities(
    impact: dict,
    cities: list[str] | None = None,
    base_weekly_revenue: float = 50_000,
) -> list[CityImpact]:
    """
    Compare impact across multiple cities.
    Defaults to comparing 3 representative cities (Tier 1, 2, 3).
    """
    if cities is None:
        cities = ["Mumbai", "Nagpur", "Rural Maharashtra"]
    return [adjust_impact_for_city(impact, c, base_weekly_revenue) for c in cities]
