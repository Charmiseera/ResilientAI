"""
NLP Classifier — extracts risk level and commodity tags from news headlines.
Uses spaCy for entity recognition + keyword matching for speed.
"""
from __future__ import annotations
import re
import spacy
from dataclasses import dataclass, field


# ── Risk keyword sets ─────────────────────────────────────────────────────────
_RISK_HIGH_KEYWORDS = {
    "closure", "war", "conflict", "attack", "sanction", "embargo",
    "shortage", "crisis", "disruption", "block", "halt", "cut off",
    "explosion", "strike", "siege", "ban", "suspend",
}
_RISK_MEDIUM_KEYWORDS = {
    "delay", "slowdown", "tension", "uncertainty", "concern",
    "protest", "storm", "flood", "drought", "rise", "surge",
}

# ── Commodity keyword → canonical name ───────────────────────────────────────
_COMMODITY_MAP: dict[str, str] = {
    "lpg": "LPG", "liquefied petroleum": "LPG", "gas": "LPG",
    "crude": "crude_oil", "oil": "crude_oil", "petroleum": "crude_oil",
    "diesel": "diesel", "fuel": "diesel",
    "wheat": "wheat", "grain": "wheat", "flour": "wheat",
    "edible oil": "edible_oil", "cooking oil": "edible_oil", "palm oil": "edible_oil",
    "transport": "transport", "shipping": "transport", "freight": "transport",
    "pharma": "pharma", "medicine": "pharma", "drug": "pharma", "chemical": "pharma",
    "fmcg": "FMCG", "consumer goods": "FMCG",
}

# Known trade routes and regions → commodity hint
_REGION_COMMODITY_HINTS: dict[str, list[str]] = {
    "hormuz": ["LPG", "crude_oil", "diesel"],
    "suez": ["crude_oil", "FMCG", "transport"],
    "ukraine": ["wheat", "edible_oil"],
    "russia": ["crude_oil", "wheat"],
    "israel": ["LPG", "crude_oil"],
    "taiwan": ["FMCG"],
}


@dataclass
class ClassificationResult:
    risk_level: str          # LOW | MEDIUM | HIGH
    confidence: float        # 0.0 – 1.0
    commodities: list[str] = field(default_factory=list)
    matched_keywords: list[str] = field(default_factory=list)


def _load_nlp() -> spacy.language.Language:
    """Load spaCy model (small English model)."""
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        # Fallback: blank English model without NER if model not downloaded
        return spacy.blank("en")


_nlp = _load_nlp()


def classify(headline: str) -> ClassificationResult:
    """
    Classify a news headline into risk level + commodity tags.

    Args:
        headline: Raw news headline text.

    Returns:
        ClassificationResult with risk_level, confidence, and commodities.
    """
    text_lower = headline.lower()
    doc = _nlp(headline)

    # ── Step 1: Risk level detection ─────────────────────────────────────────
    high_matches = [kw for kw in _RISK_HIGH_KEYWORDS if kw in text_lower]
    med_matches = [kw for kw in _RISK_MEDIUM_KEYWORDS if kw in text_lower]

    if high_matches:
        risk_level = "HIGH"
        base_confidence = 0.75 + min(len(high_matches) * 0.05, 0.20)
    elif med_matches:
        risk_level = "MEDIUM"
        base_confidence = 0.55 + min(len(med_matches) * 0.05, 0.15)
    else:
        risk_level = "LOW"
        base_confidence = 0.40

    # ── Step 2: Commodity detection ──────────────────────────────────────────
    detected_commodities: set[str] = set()

    # Keyword scan
    for keyword, commodity in _COMMODITY_MAP.items():
        if keyword in text_lower:
            detected_commodities.add(commodity)

    # Region → commodity hints
    for region, hints in _REGION_COMMODITY_HINTS.items():
        if region in text_lower:
            detected_commodities.update(hints)
            base_confidence = min(base_confidence + 0.05, 0.97)

    # ── Step 3: Confidence cap ───────────────────────────────────────────────
    confidence = round(min(base_confidence, 0.97), 2)

    return ClassificationResult(
        risk_level=risk_level,
        confidence=confidence,
        commodities=sorted(detected_commodities),
        matched_keywords=high_matches + med_matches,
    )
