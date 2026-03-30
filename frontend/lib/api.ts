/**
 * ResilientAI API Client
 * Connects React frontend to the FastAPI Python backend (port 8000).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DisruptionEvent {
  id: string;
  headline: string;
  source: string;
  published_at: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  commodities_affected: string[];
  // Business-adjusted fields (added by backend risk scorer)
  business_risk_level?: "LOW" | "MEDIUM" | "HIGH";
  business_sensitivity?: number;   // 0-2.0 — how much this biz type is affected
  business_confidence?: number;    // adjusted confidence for this biz type
  is_relevant?: boolean;
}

export interface RecommendResponse {
  recommended_action: string;
  description: string;
  profit_impact_inr: number;
  reason: string;
  generated_by: string;
  confidence: number;
  alternatives: { action: string; profit_impact_inr: number; risk_score: number }[];
}

export interface SimulateResponse {
  action: string;
  projected_weekly_revenue_inr: number;
  projected_weekly_profit_inr: number;
  projected_margin_pct: number;
  vs_baseline_profit_delta_inr: number;
}

export interface ImpactResponse {
  event_id: string;
  business_type: string;
  commodities: string[];
  cost_changes: Record<string, number>;
  margin_change: number;
  demand_change: number;
  confidence_interval: number;
  risk_level: string;
  raw_summary: string;
}

export interface CityResult {
  city: string;
  tier: number;
  state: string;
  adjusted_margin_change: number;
  adjusted_demand_change: number;
  adjusted_profit_inr: number;
  price_multiplier: number;
  shock_absorption: number;
  adjusted_cost_changes: Record<string, number>;
}

export interface BehaviorSummary {
  user_id: string;
  total_accepted_decisions: number;
  total_profit_gained_inr: number;
  total_strategies_adopted: number;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** GET /alerts — Live risk alerts adjusted for the user's business type */
export const getAlerts = (minRisk = "MEDIUM", businessType = "kirana") =>
  apiFetch<DisruptionEvent[]>(`/alerts?min_risk=${minRisk}&business_type=${businessType}`);

/** POST /recommend — Quantum optimizer → best recommendation */
export const getRecommendation = (eventId: string, businessType: string) =>
  apiFetch<RecommendResponse>("/recommend", {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, business_type: businessType }),
  });

/** POST /simulate — Backend profit simulation model */
export const simulateProfit = (params: {
  action: string;
  current_weekly_revenue_inr: number;
  current_margin_pct: number;
  price_delta_inr: number;
  extra_units: number;
}) =>
  apiFetch<SimulateResponse>("/simulate", {
    method: "POST",
    body: JSON.stringify(params),
  });

/** POST /impact — Impact engine analysis */
export const getImpact = (eventId: string, businessType: string) =>
  apiFetch<ImpactResponse>("/impact", {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, business_type: businessType }),
  });

/** POST /decisions — Log accepted decision (saved to Supabase via backend) */
export const logDecision = (params: {
  user_id: string;
  event_id: string;
  business_type: string;
  action_taken: string;
  profit_impact_inr: number;
  engine: string;
}) =>
  apiFetch("/decisions", { method: "POST", body: JSON.stringify(params) });

/** POST /strategies — Log adopted strategy to Supabase via backend */
export const logStrategy = (params: {
  user_id: string;
  weekly_revenue: number;
  current_margin_pct: number;
  price_delta: number;
  extra_units: number;
  projected_profit: number;
  snapshot: Record<string, unknown>;
}) =>
  apiFetch("/strategies", { method: "POST", body: JSON.stringify(params) });

/** GET /behavior/:id — User behavior summary for AI agent pattern learning */
export const getBehaviorSummary = (userId: string) =>
  apiFetch<BehaviorSummary>(`/behavior/${userId}`);

/** Health check — returns null if backend is down */
export const checkHealth = () =>
  fetch("http://localhost:8000/health")
    .then(r => r.json())
    .catch(() => null);
