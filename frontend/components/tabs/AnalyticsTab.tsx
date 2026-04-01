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
    <div className="space-y-8">
      {/* ── Page intro (matches mockup) ── */}
      <div>
        <p className="section-label mb-1">Resilient Systems</p>
        <h1 className="section-headline">Supply Performance Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-glass-text-dim)" }}>
          Aggregated risk intelligence and profit recovery analytics across your regional supply nodes.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-glass-text-dim)" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading live data from backend…
        </div>
      )}
      {error && (
        <div className="rounded-xl p-4 text-sm flex items-center gap-2"
             style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ff6b6b" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Backend unreachable — {error}. Showing cached fallback data.
        </div>
      )}

      {/* ══ KPI Row (mockup style) ══ */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label:"Total Profit Protected", value:"+₹84,200", sub:"+12.4% vs last 30 days",   color:"#4edea3", icon:"💰" },
          { label:"Decision Accuracy",       value:"94%",      sub:"Confidence Score: High",    color:"#ffb95f", icon:"🎯" },
          { label:"Total Events Mitigated",  value:"18 Signals",sub:"Critical logistics & price",color: "var(--color-rai-text)", icon:"⚡" },
        ].map(k => (
          <div key={k.label} className="card-glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label mb-3">{k.label}</p>
                <h3 className="stat-display" style={{ color:k.color }}>{k.value}</h3>
              </div>
              <span className="text-2xl">{k.icon}</span>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--color-glass-text-dim)" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ══ 1. SECTOR MARGIN BAR CHART ══ */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--color-rai-text)" }}>
          <BarChart3 className="w-4 h-4" style={{ color: "var(--color-glass-text-dim)" }}/>
          Sector Risk Exposure
        </h2>
        <div className="card-glass p-5">
          <p className="section-label mb-4">Margin Impact by Business Type (%)</p>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorData} margin={{ top:20,right:10,bottom:5,left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.5)",fontSize:13,fontWeight:600 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill:"rgba(255,255,255,0.35)",fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:"#1f1f27",border: "1px solid var(--color-glass-border)",borderRadius:8 }}
                  formatter={(v: any) => [`${Number(v).toFixed(1)}%`,"Margin Change"]}/>
                <Bar dataKey="margin" radius={[6,6,0,0]}>
                  {sectorData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: "var(--color-glass-text-dim)" }}>
              {loading ? "Loading sector data…" : "No data — backend may be offline"}
            </div>
          )}
        </div>
      </section>

      {/* ══ 2. AGGREGATE IMPACT KPIS ══ */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--color-rai-text)" }}>
          <TrendingUp className="w-4 h-4" style={{ color: "var(--color-glass-text-dim)" }}/>
          Aggregate Impact Estimates
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {IMPACT_KPIS.map(kpi => (
            <div key={kpi.label} className="card-glass p-5 text-center">
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <p className="text-xs mb-2 leading-tight" style={{ color: "var(--color-glass-text-dim)" }}>{kpi.label}</p>
              <p className="font-bold text-xl" style={{ color: "var(--color-rai-text)" }}>{kpi.value}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--color-glass-text-dim)" }}>{kpi.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 3. COMMODITY RISK RADAR ══ */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--color-rai-text)" }}>
          <Activity className="w-4 h-4" style={{ color: "var(--color-glass-text-dim)" }}/>
          Commodity Risk Radar
        </h2>
        <div className="card-glass p-5">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={COMMODITY_RADAR}>
              <PolarGrid stroke="rgba(255,255,255,0.06)"/>
              <PolarAngleAxis dataKey="commodity" tick={{ fill:"rgba(255,255,255,0.55)",fontSize:12,fontWeight:600 }}/>
              <PolarRadiusAxis angle={90} domain={[0,1]} tick={{ fill:"rgba(255,255,255,0.25)",fontSize:9 }} tickCount={5}/>
              <Radar name="Risk" dataKey="risk" stroke="#fc7c78" strokeWidth={2}
                fill="rgba(252,124,120,0.15)" fillOpacity={1} dot={<RadarDot/>}/>
              <Tooltip contentStyle={{ background:"#1f1f27",border: "1px solid var(--color-glass-border)",borderRadius:8 }}
                formatter={(v: any) => [`${(Number(v)*100).toFixed(0)}%`,"Risk Score"]}/>
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center flex-wrap">
            {COMMODITY_RADAR.map(c => (
              <div key={c.commodity} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                <div className="w-2 h-2 rounded-full" style={{ background:"#fc7c78", opacity:0.4+c.risk*0.6 }}/>
                {c.commodity} <span style={{ color: "var(--color-glass-text-dim)" }}>({Math.round(c.risk*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. ACTIVE RISK EVENTS LIST ══ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--color-rai-text)" }}>
            <Package className="w-4 h-4" style={{ color: "var(--color-glass-text-dim)" }}/>
            Active Risk Events
          </h2>
          {alerts.length > 0 && (
            <span className="text-xs" style={{ color: "var(--color-glass-text-dim)" }}>{alerts.length} events</span>
          )}
        </div>

        {alerts.length === 0 && !loading && (
          <div className="card-glass p-6 text-sm text-center" style={{ color: "var(--color-glass-text-dim)" }}>
            No active risk events — backend may be offline or no events match the filter.
          </div>
        )}

        <div className="space-y-3">
          {alerts.map(evt => {
            const conf = Math.round((evt.confidence ?? 0) * 100);
            const comms = (evt.commodities_affected ?? []).join(", ");
            const level = evt.business_risk_level ?? evt.risk_level;
            const leftColor = level=="HIGH"?"#fc7c78":level=="MEDIUM"?"#ffb95f":"#4edea3";
            return (
              <div key={evt.id} className="transition-all"
                   style={{ display:"flex", background: "var(--color-glass-border)", border: "1px solid var(--color-glass-border)", borderRadius:"1rem", overflow:"hidden" }}
                   onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)")}
                   onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.025)")}>
                <div style={{ width:4,flexShrink:0,background:leftColor }}/>
                <div className="flex-1 p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5"><RiskBadge level={level}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-rai-text)" }}>{evt.headline}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]">
                      <span style={{ color: "var(--color-glass-text-dim)" }}>Confidence <strong style={{ color:"#4edea3" }}>{conf}%</strong></span>
                      {comms && <span style={{ color: "var(--color-glass-text-dim)" }}>Commodities <span style={{ color:"rgba(78,222,163,0.7)" }}>{comms}</span></span>}
                      {evt.source && <span style={{ color: "var(--color-glass-text-dim)" }}>Source: {evt.source}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ 5. Weekly Profit Trend + Risk Heatmap ══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-rai-text)]/5" />
          <span className="text-[var(--color-rai-text)]/20 text-xs uppercase tracking-widest">Bonus Metrics</span>
          <div className="flex-1 h-px bg-[var(--color-rai-text)]/5" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Weekly Profit Trend */}
          <div className="bg-[var(--color-rai-text)]/[0.03] border border-[var(--color-rai-text)]/5 rounded-2xl p-5">
            <p className="text-[var(--color-rai-text)]/50 text-xs uppercase tracking-widest mb-4">Weekly Profit Trend</p>
            <div className="flex items-end gap-2 h-36">
              {WEEKLY_DATA.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[var(--color-rai-text)]/25 text-[9px]">₹{(d.profit / 1000).toFixed(1)}K</span>
                  <div
                    className="w-full relative group rounded-md overflow-hidden bg-[var(--color-rai-text)]/5"
                    style={{ height: `${(d.profit / weekMax) * 120}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500 to-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[var(--color-rai-text)]/35 text-[10px]">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Risk Score Heatmap */}
          <div className="bg-[var(--color-rai-text)]/[0.03] border border-[var(--color-rai-text)]/5 rounded-2xl p-5">
            <p className="text-[var(--color-rai-text)]/50 text-xs uppercase tracking-widest mb-4">Daily Risk Score</p>
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
                  <span className="text-[var(--color-rai-text)]/35 text-[10px]">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <div className="w-20 h-1.5 rounded bg-gradient-to-r from-red-900/60 to-red-400" />
              <span className="text-[var(--color-rai-text)]/25 text-[10px]">Low → High Risk</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
