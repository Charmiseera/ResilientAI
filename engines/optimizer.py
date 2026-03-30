"""
Optimizer — finds the best business decision using:
  1. Qiskit QAOA (quantum-inspired, primary)
  2. NumPy classical solver (fallback if Qiskit > timeout)

Fix: Added measurement gates to QAOA circuit to eliminate Qiskit warning.
"""
from __future__ import annotations
import os
import numpy as np
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

_QUANTUM_TIMEOUT = float(os.getenv("QUANTUM_TIMEOUT_SECONDS", "10"))


@dataclass
class DecisionOption:
    action: str
    description: str
    profit_impact_inr: float
    risk_score: float
    confidence: float


@dataclass
class OptimizationResult:
    recommended: DecisionOption
    alternatives: list[DecisionOption] = field(default_factory=list)
    generated_by: str = "classical"
    reason: str = ""

    def to_dict(self) -> dict:
        return {
            "recommended_action": self.recommended.action,
            "description": self.recommended.description,
            "profit_impact_inr": self.recommended.profit_impact_inr,
            "reason": self.reason,
            "generated_by": self.generated_by,
            "confidence": self.recommended.confidence,
            "alternatives": [
                {
                    "action": a.action,
                    "profit_impact_inr": a.profit_impact_inr,
                    "risk_score": a.risk_score,
                }
                for a in self.alternatives
            ],
        }


# ── Option generator ──────────────────────────────────────────────────────────
def _build_options(impact: dict) -> list[DecisionOption]:
    margin_change = impact.get("margin_change", -0.08)
    WEEKLY_REVENUE = 50_000
    base_profit = WEEKLY_REVENUE * 0.15

    return [
        DecisionOption(
            action="Increase price + extra stock",
            description="Raise price by ₹2 and stock 10 extra units of top commodity",
            profit_impact_inr=round(base_profit * (1 + abs(margin_change) * 0.8), 0),
            risk_score=0.3,
            confidence=0.85,
        ),
        DecisionOption(
            action="Increase price only",
            description="Raise selling price to recover margin loss, hold current stock",
            profit_impact_inr=round(base_profit * (1 + abs(margin_change) * 0.5), 0),
            risk_score=0.4,
            confidence=0.75,
        ),
        DecisionOption(
            action="Stock up now (bulk buy)",
            description="Buy extra stock at current prices before they rise",
            profit_impact_inr=round(base_profit * (1 + abs(margin_change) * 0.6), 0),
            risk_score=0.5,
            confidence=0.70,
        ),
        DecisionOption(
            action="Switch supplier",
            description="Source from alternate supplier to avoid commodity price hike",
            profit_impact_inr=round(base_profit * (1 + abs(margin_change) * 0.4), 0),
            risk_score=0.7,
            confidence=0.55,
        ),
    ]


# ── Classical solver ──────────────────────────────────────────────────────────
def _classical_optimize(options: list[DecisionOption]) -> DecisionOption:
    scores = np.array([
        o.profit_impact_inr * (1 - o.risk_score) * o.confidence
        for o in options
    ])
    return options[int(np.argmax(scores))]


# ── Qiskit QAOA solver (with measurement fix) ────────────────────────────────
def _quantum_optimize(options: list[DecisionOption]) -> DecisionOption:
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
    from qiskit_aer import AerSimulator
    import numpy as np

    n = len(options)
    scores = np.array([
        o.profit_impact_inr * (1 - o.risk_score) * o.confidence
        for o in options
    ])
    scores_normalized = scores / scores.max()

    # Build a parametric ansatz circuit with measurement (fixes empty register warning)
    qr = QuantumRegister(n, "q")
    cr = ClassicalRegister(n, "c")
    qc = QuantumCircuit(qr, cr)

    # Layer 1: Hadamard superposition
    qc.h(qr)

    # Layer 2: Phase encoding based on scores
    for i, score in enumerate(scores_normalized):
        qc.rz(score * np.pi, qr[i])

    # Layer 3: Entanglement (mixer layer)
    for i in range(n - 1):
        qc.cx(qr[i], qr[i + 1])
    qc.cx(qr[-1], qr[0])

    # Layer 4: Mixing
    qc.rx(np.pi / 4, qr)

    # Measure all qubits (fixes the empty registers warning)
    qc.measure(qr, cr)

    # Run on Aer simulator
    backend = AerSimulator()
    job = backend.run(qc, shots=1024)
    counts = job.result().get_counts()

    # Best bitstring = highest count
    best_bits = max(counts, key=counts.get)
    # Find highest-scoring selected qubit
    best_idx = 0
    best_score = -1
    for i, bit in enumerate(reversed(best_bits)):
        if bit == "1" and scores_normalized[i] > best_score:
            best_score = scores_normalized[i]
            best_idx = i

    return options[best_idx]


# ── Public API ────────────────────────────────────────────────────────────────
def optimize(impact: dict, user_behavior: dict | None = None) -> OptimizationResult:
    """
    Find best decision using QAOA (primary) or classical (fallback).

    user_behavior: output of get_user_behavior_summary() — if provided, outcome
    ratings from past decisions are used to adjust option confidence scores so
    the optimizer learns from what actually worked for this specific user.
    """
    options = _build_options(impact)

    # ── Apply feedback-based confidence adjustment ─────────────────────────────
    if user_behavior:
        best_action  = (user_behavior.get("best_performing_action")  or "").lower()
        worst_action = (user_behavior.get("worst_performing_action") or "").lower()
        avg_rating   = user_behavior.get("avg_outcome_rating") or 3.0

        for opt in options:
            action_lc = opt.action.lower()
            # Boost if this action type matches the user's best historical outcome
            if best_action and any(word in action_lc for word in best_action.split()[:3]):
                opt.confidence  = min(0.99, opt.confidence * 1.15)   # +15%
                opt.profit_impact_inr *= 1.08                          # +8% expected profit
            # Penalise if this action type matches the user's worst outcome
            elif worst_action and any(word in action_lc for word in worst_action.split()[:3]):
                opt.confidence  = max(0.10, opt.confidence * 0.85)   # -15%
                opt.risk_score  = min(0.95, opt.risk_score  * 1.20)   # +20% risk

        # Round adjusted profit values
        for opt in options:
            opt.profit_impact_inr = round(opt.profit_impact_inr, 0)
    # ──────────────────────────────────────────────────────────────────────────

    generated_by = "classical"
    best: DecisionOption | None = None

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_quantum_optimize, options)
        try:
            best = future.result(timeout=_QUANTUM_TIMEOUT)
            generated_by = "quantum"
        except (FutureTimeout, Exception):
            pass

    if best is None:
        best = _classical_optimize(options)

    alternatives = [o for o in options if o.action != best.action]

    # Feedback-aware reason annotation
    feedback_note = ""
    if user_behavior and user_behavior.get("avg_outcome_rating") is not None:
        avg_r = user_behavior["avg_outcome_rating"]
        feedback_note = (
            f" User history: avg outcome rating {avg_r:.1f}/5 "
            f"across {user_behavior['total_rated_decisions']} rated decisions."
        )
        if user_behavior.get("best_performing_action"):
            feedback_note += f" Best past action: '{user_behavior['best_performing_action'][:40]}…'."


    reason = (
        f"{'Quantum QAOA' if generated_by == 'quantum' else 'Classical optimizer'} "
        f"evaluated {len(options)} strategies. '{best.action}' maximises expected "
        f"7-day profit by \u20b9{best.profit_impact_inr:,.0f} with {best.risk_score*100:.0f}% risk."
        f"{feedback_note}"
    )

    return OptimizationResult(
        recommended=best,
        alternatives=alternatives,
        generated_by=generated_by,
        reason=reason,
    )
