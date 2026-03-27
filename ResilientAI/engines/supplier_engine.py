"""
Supplier Discovery Engine
Recommends alternative suppliers based on disrupted commodities.
"""
from __future__ import annotations
import json
from pathlib import Path

_SUPPLIERS_FILE = Path(__file__).parent.parent / "data" / "suppliers.json"


def _load_suppliers() -> list[dict]:
    if not _SUPPLIERS_FILE.exists():
        return []
    with open(_SUPPLIERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_suppliers_for_commodities(commodities: list[str]) -> dict[str, list[dict]]:
    """
    Return supplier options for each affected commodity.
    Args:
        commodities: List of commodity names from a DisruptionEvent
    Returns:
        Dict mapping commodity → list of supplier dicts
    """
    all_suppliers = _load_suppliers()
    result: dict[str, list[dict]] = {}

    for entry in all_suppliers:
        commodity = entry.get("commodity", "")
        if commodity in commodities:
            result[commodity] = entry.get("suppliers", [])

    return result


def get_best_supplier(commodity: str) -> dict | None:
    """Return the best (highest availability, lowest lead time) supplier for a commodity."""
    suppliers_map = get_suppliers_for_commodities([commodity])
    suppliers = suppliers_map.get(commodity, [])
    if not suppliers:
        return None

    avail_order = {"high": 0, "medium": 1, "variable": 2, "low": 3}
    return min(suppliers, key=lambda s: (
        avail_order.get(s.get("availability", "low"), 3),
        s.get("lead_time_days", 99),
    ))
