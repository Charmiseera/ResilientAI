"use client";

import { useState, useEffect, useCallback } from "react";
import { getAlerts, getImpact, type DisruptionEvent, type ImpactResponse } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { TrendingUp, AlertTriangle, Loader2, Activity, Package, BarChart3 } from "lucide-react";

// ── Static data mirroring Streamlit constants ─────────────────────────────────
const IMPACT_KPIS = [
  { icon: "🏪", label: "Kirana Stores Affected",   value: "63M+",     sub: "India estimate" },
  { icon: "💸", label: "Avg Weekly Loss / Store",   value: "₹2,400",   sub: "Without ResilientAI" },
  { icon: "✅", label: "Savings with AI",            value: "₹1,800",   sub: "74% recovered" },
  { icon: "🇮🇳", label: "Market Opportunity",        value: "₹150 Cr+", sub: "Monthly impact" },
];

const COMMODITY_RADAR = [
  { commodity: "LPG",        risk: 0.85 },
  { commodity: "Diesel",     risk: 0.70 },
  { commodity: "Wheat",      risk: 0.60 },
  { commodity: "Edible Oil", risk: 0.55 },
  { commodity: "Transport",  risk: 0.75 },
];

const SECTORS: { key: string; label: string; color: string }[] = [
  { key: "kirana",     label: "Kirana",     color: "#FF453A" },
  { key: "restaurant", label: "Restaurant", color: "#FF9F0A" },
  { key: "pharma",     label: "Pharma",     color: "#30A2FF" },
];

// Weekly trend (bonus — kept from original React tab)
const WEEKLY_DATA = [
  { day: "Mon", profit: 12400, risk: 3 },
  { day: "Tue", profit: 15200, risk: 5 },
  { day: "Wed", profit: 11800, risk: 2 },
  { day: "Thu", profit: 18900, risk: 7 },
  { day: "Fri", profit: 21300, risk: 4 },
  { day: "Sat", profit: 16700, risk: 6 },
  { day: "Sun", profit: 14100, risk: 1 },
];

const weekMax = Math.max(...WEEKLY_DATA.map(d => d.profit));

// ── Component ─────────────────────────────────────────────────────────────────
export function AnalyticsTab() {
  const [sectorData,  setSectorData]  = useState<{ name: string; margin: number; color: string }[]>([]);
  const [alerts,      setAlerts]      = useState<DisruptionEvent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ── Sector margins via /impact for Hormuz (evt_001) ──
      const impacts = await Promise.all(
        SECTORS.map(s =>
          getImpact("evt_001", s.key).catch(() => null) as Promise<ImpactResponse | null>
        )
      );
      setSectorData(
        SECTORS.map((s, i) => ({
          name:   s.label,
          margin: impacts[i] ? Math.round((impacts[i]!.margin_change ?? 0) * 1000) / 10 : 0,
          color:  s.color,
        }))
      );

      // ── Active events via /alerts (min_risk=LOW to get all) ──
      const evts = await getAlerts("LOW", "kirana");
      setAlerts(evts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Risk level badge ──────────────────────────────────────────────────────
  const RiskBadge = ({ level }: { level: string }) => {
    const styles: Record<string, string> = {
      HIGH:   "bg-red-500/20 text-red-300 border-red-500/30",
      MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      LOW:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
    const icons: Record<string, string> = { HIGH: "🔴", MEDIUM: "🟡", LOW: "⚪" };
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[level] ?? styles.LOW}`}>
        {icons[level] ?? "⚪"} {level}
      </span>
    );
  };

  // ── Custom radar dot ──────────────────────────────────────────────────────
  const RadarDot = (props: any) => {
    const { cx, cy } = props;
    return <circle cx={cx} cy={cy} r={4} fill="#FF4444" stroke="#FF4444" strokeWidth={1} />;
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Impact Analytics</h1>
        <p className="text-white/40 text-sm mt-1">
          Sector-wide supply chain risk overview and aggregate business impact.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-white/40 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading live data from backend…
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Backend unreachable — {error}. Showing cached fallback data.
        </div>
      )}

      {/* ══ 1. SECTOR MARGIN BAR CHART (Streamlit: "Sector Risk Exposure") ══ */}
      <section className="space-y-4">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/40" />
          🏭 Sector Risk Exposure — Hormuz Scenario
        </h2>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Margin Impact by Business Type (%)</p>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sectorData} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Margin Change"]}
                />
                <Bar dataKey="margin" radius={[6, 6, 0, 0]} label={{ position: "top", fill: "rgba(255,255,255,0.5)", fontSize: 11, formatter: (v: unknown) => { const n = Number(v); return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`; } }}>
                  {sectorData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">
              {loading ? "Loading sector data…" : "No data — backend may be offline"}
            </div>
          )}
        </div>
      </section>

      {/* ══ 2. AGGREGATE IMPACT KPIS (Streamlit: "Aggregate Impact Estimates") ══ */}
      <section className="space-y-4">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-white/40" />
          📈 Aggregate Impact Estimates
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {IMPACT_KPIS.map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <p className="text-white/40 text-xs mb-2 leading-tight">{kpi.label}</p>
              <p className="text-white font-bold text-xl">{kpi.value}</p>
              <p className="text-white/25 text-[10px] mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 3. COMMODITY RISK RADAR (Streamlit: "Commodity Risk Radar") ══ */}
      <section className="space-y-4">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-white/40" />
          🎯 Commodity Risk Radar
        </h2>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={COMMODITY_RADAR}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="commodity"
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 1]}
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                tickCount={5}
              />
              <Radar
                name="Risk"
                dataKey="risk"
                stroke="#FF4444"
                strokeWidth={2}
                fill="rgba(255,68,68,0.20)"
                fillOpacity={1}
                dot={<RadarDot />}
              />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                formatter={(v: any) => [`${(Number(v) * 100).toFixed(0)}%`, "Risk Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
          {/* Legend bars */}
          <div className="flex gap-4 mt-2 justify-center flex-wrap">
            {COMMODITY_RADAR.map(c => (
              <div key={c.commodity} className="flex items-center gap-1.5 text-xs text-white/50">
                <div className="w-2 h-2 rounded-full bg-red-400" style={{ opacity: 0.4 + c.risk * 0.6 }} />
                {c.commodity}
                <span className="text-white/30">({Math.round(c.risk * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. ACTIVE RISK EVENTS LIST (Streamlit: "Active Risk Events") ══ */}
      <section className="space-y-4">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-white/40" />
          📋 Active Risk Events
          {alerts.length > 0 && (
            <span className="ml-auto text-xs text-white/30">{alerts.length} events</span>
          )}
        </h2>

        {alerts.length === 0 && !loading && (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-white/30 text-sm text-center">
            No active risk events — backend may be offline or no events match the filter.
          </div>
        )}

        <div className="space-y-3">
          {alerts.map(evt => {
            const conf = Math.round((evt.confidence ?? 0) * 100);
            const comms = (evt.commodities_affected ?? []).join(", ");
            const level = evt.business_risk_level ?? evt.risk_level;
            return (
              <div
                key={evt.id}
                className="bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <RiskBadge level={level} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                      {evt.headline}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-white/35">
                      <span className="flex items-center gap-1">
                        <span className="text-white/20">Confidence</span>
                        <span className="text-white/55 font-semibold">{conf}%</span>
                      </span>
                      {comms && (
                        <span className="flex items-center gap-1">
                          <span className="text-white/20">Commodities</span>
                          <span className="text-cyan-400/70 font-mono">{comms}</span>
                        </span>
                      )}
                      {evt.source && (
                        <span className="flex items-center gap-1">
                          <span className="text-white/20">Source</span>
                          <span className="text-white/40">{evt.source}</span>
                        </span>
                      )}
                      {evt.published_at && (
                        <span className="text-white/25">{evt.published_at.slice(0, 10)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ 5. BONUS: Weekly Profit Trend + Risk Heatmap (original React extras, kept) ══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs uppercase tracking-widest">Bonus Metrics</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Weekly Profit Trend */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Weekly Profit Trend</p>
            <div className="flex items-end gap-2 h-36">
              {WEEKLY_DATA.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-white/25 text-[9px]">₹{(d.profit / 1000).toFixed(1)}K</span>
                  <div
                    className="w-full relative group rounded-md overflow-hidden bg-white/5"
                    style={{ height: `${(d.profit / weekMax) * 120}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500 to-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-white/35 text-[10px]">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Risk Score Heatmap */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Daily Risk Score</p>
            <div className="flex gap-2">
              {WEEKLY_DATA.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full h-12 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: `rgba(239,68,68,${d.risk / 10})`,
                      color: d.risk > 5 ? "white" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {d.risk}
                  </div>
                  <span className="text-white/35 text-[10px]">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <div className="w-20 h-1.5 rounded bg-gradient-to-r from-red-900/60 to-red-400" />
              <span className="text-white/25 text-[10px]">Low → High Risk</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
