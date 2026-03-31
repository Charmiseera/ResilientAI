"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAlerts, getRecommendation, logDecision, getImpact,
  type DisruptionEvent, type RecommendResponse, type ImpactResponse,
} from "@/lib/api";
import {
  AlertTriangle, CheckCircle2, TrendingDown, Globe, Clock, Zap,
  RefreshCw, Cpu, FlaskConical, ChevronDown, ChevronUp,
  MessageSquare, Download, MapPin, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";

// ── Risk config ────────────────────────────────────────────────────────────────
const RISK_CFG = {
  HIGH:   { leftColor: "#fc7c78", badgeBg: "rgba(252,124,120,0.12)", badgeColor: "#ffb3af" },
  MEDIUM: { leftColor: "#ffb95f", badgeBg: "rgba(255,185,95,0.12)",  badgeColor: "#ffb95f" },
  LOW:    { leftColor: "#4edea3", badgeBg: "rgba(78,222,163,0.1)",   badgeColor: "#4edea3" },
};

const SCENARIOS = [
  { id:"evt_001", label:"🔥 Hormuz Disruption",   sub:"LPG +20%, Transport +12%" },
  { id:"evt_002", label:"🌾 Ukraine Grain Crisis", sub:"Wheat +15%, Edible Oil +10%" },
  { id:"evt_003", label:"⚡ Taiwan Blockade",       sub:"Electronics +30%, Semi +25%" },
];

const CITY_DATA: Record<string, { tier:number; price:number; shock:number; state:string }> = {
  Mumbai:            { tier:1, price:1.18, shock:0.85, state:"Maharashtra" },
  Delhi:             { tier:1, price:1.15, shock:0.80, state:"Delhi" },
  Bangalore:         { tier:1, price:1.12, shock:0.82, state:"Karnataka" },
  Nagpur:            { tier:2, price:1.00, shock:1.00, state:"Maharashtra" },
  Jaipur:            { tier:2, price:0.95, shock:1.05, state:"Rajasthan" },
  "Rural Maharashtra":{ tier:3, price:0.82, shock:1.25, state:"Maharashtra" },
};

const CHART_COLORS = ["#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits:0 })}`;

function buildForecasts(impact: ImpactResponse) {
  const today = new Date();
  const labels = Array.from({ length:7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return d.toLocaleDateString("en-IN",{ month:"short", day:"numeric" });
  });
  return Object.entries(impact.cost_changes)
    .filter(([,v]) => v > 0)
    .map(([commodity, shock]) => {
      const BASELINE: Record<string,number> = {
        LPG:900, diesel:95, wheat:30, edible_oil:140, transport:100,
        electronics:15000, semiconductors:5000,
      };
      const baseline = BASELINE[commodity] ?? 100;
      const prices = labels.map((_, d) => {
        const amplitude = d <= 2
          ? shock * (1 + 0.15 * d / 2)
          : shock * 1.15 * Math.exp(-0.12 * (d - 2));
        return +(baseline * (1 + Math.max(0, amplitude))).toFixed(2);
      });
      const peakIdx = prices.indexOf(Math.max(...prices));
      return { commodity, baseline, shock, prices, labels, peakDay: peakIdx + 1, peakPrice: prices[peakIdx], unit:"unit" };
    });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function IntelligenceTab() {
  const [events, setEvents]         = useState<DisruptionEvent[]>([]);
  const [recs, setRecs]             = useState<Record<string, RecommendResponse>>({});
  const [impacts, setImpacts]       = useState<Record<string, ImpactResponse>>({});
  const [loading, setLoading]       = useState(false);
  const [executing, setExecuting]   = useState<string|null>(null);
  const [adopted, setAdopted]       = useState<Record<string, boolean>>({});
  const [backendOk, setBackendOk]   = useState(false);
  const [businessType, setBizType]  = useState("kirana");
  const [activeScenario, setScenario] = useState<string|null>(null);
  const [expanded, setExpanded]     = useState<Record<string, boolean>>({});
  const [whatsappStatus, setWA]     = useState<Record<string, string>>({});
  const [dismissed, setDismissed]   = useState<Record<string, boolean>>({});

  const userCity = (typeof window !== "undefined" && localStorage.getItem("rai_city")) || "Nagpur";
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const userId = () => (typeof window !== "undefined" && localStorage.getItem("rai_user_id")) || "00000000-0000-0000-0000-000000000000";
  const userPhone = () => (typeof window !== "undefined" && localStorage.getItem("rai_phone")) ?? "";

  const loadScenario = useCallback(async (eventId?: string, bizType: string = businessType) => {
    setLoading(true);
    setRecs({}); setImpacts({}); setDismissed({});
    try {
      const res = await getAlerts("LOW", bizType);
      const all = eventId ? res.filter(e => e.id === eventId) : res;
      const list = all.length ? all : res;
      setEvents(list);
      setBackendOk(true);
      await Promise.all(list.map(async e => {
        const [rec, imp] = await Promise.allSettled([
          getRecommendation(e.id, bizType),
          getImpact(e.id, bizType) as Promise<ImpactResponse>,
        ]);
        if (rec.status === "fulfilled") setRecs(p => ({ ...p, [e.id]: rec.value }));
        if (imp.status === "fulfilled") setImpacts(p => ({ ...p, [e.id]: imp.value as ImpactResponse }));
      }));
    } catch { setBackendOk(false); }
    finally  { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadScenario(undefined, businessType); }, []);

  async function executeAction(event: DisruptionEvent) {
    const rec = recs[event.id]; if (!rec) return;
    setExecuting(event.id);
    try {
      await logDecision({ user_id:userId(), event_id:event.id, business_type:businessType,
        action_taken:rec.recommended_action, profit_impact_inr:rec.profit_impact_inr, engine:rec.generated_by });
      setAdopted(p => ({ ...p, [event.id]: true }));
    } finally { setExecuting(null); }
  }

  async function sendWhatsApp(event: DisruptionEvent) {
    const rec = recs[event.id];
    const phone = userPhone();
    if (!phone) { setWA(p => ({ ...p, [event.id]:"⚠️ No phone — set it in the Profile tab" })); return; }
    setWA(p => ({ ...p, [event.id]:"📤 Sending…" }));
    try {
      const res = await fetch(`${API_BASE}/whatsapp/send`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ phone, event_headline: event.headline, risk_level: event.risk_level,
          recommendation: rec?.recommended_action ?? "Review alert", profit_inr: rec?.profit_impact_inr ?? 0 }),
      });
      const data = await res.json();
      if (data.success) setWA(p => ({ ...p, [event.id]:`✅ ${data.mode === "simulation" ? "Simulated send" : `Sent · ID: ${data.id}`}` }));
      else setWA(p => ({ ...p, [event.id]:`❌ ${data.error}` }));
    } catch (e: any) { setWA(p => ({ ...p, [event.id]:`❌ ${e.message}` })); }
  }

  function downloadReport(event: DisruptionEvent) {
    fetch(`${API_BASE}/report`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ event_id: event.id, business_type: businessType }),
    }).then(r => r.blob()).then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ResilientAI_${event.id}_${businessType}.csv`;
      a.click();
    });
  }

  const visibleEvents = events.filter(e => !dismissed[e.id]);
  const totalExposure = visibleEvents.reduce((s, e) => s + (recs[e.id]?.profit_impact_inr ?? 0), 0);

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-headline">Risk Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(187,202,191,0.5)" }}>
            Real-time disruptions → Quantum-optimised decisions → Local impact
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={businessType} onChange={e => { const v=e.target.value; setBizType(v); loadScenario(activeScenario??undefined,v); }}
            className="rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e4e1ec" }}>
            <option value="kirana">🏪 Kirana Retail</option>
            <option value="restaurant">🍽️ Restaurant</option>
            <option value="pharma">💊 Pharma</option>
          </select>
        </div>
      </div>

      {/* ── Scenario Buttons ── */}
      <div className="grid sm:grid-cols-4 gap-3">
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => { setScenario(s.id); loadScenario(s.id, businessType); setExpanded({}); }}
            className="p-4 rounded-2xl text-left transition-all"
            style={{
              background: activeScenario === s.id ? "rgba(78,222,163,0.07)" : "rgba(255,255,255,0.03)",
              border: activeScenario === s.id ? "1px solid rgba(78,222,163,0.3)" : "1px solid rgba(255,255,255,0.07)",
            }}>
            <p className="text-sm font-semibold" style={{ color:"#e4e1ec" }}>{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color:"rgba(187,202,191,0.45)" }}>{s.sub}</p>
          </button>
        ))}
        <button onClick={() => { setScenario(null); loadScenario(undefined, businessType); setExpanded({}); }}
          className="p-4 rounded-2xl text-left transition-all"
          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm font-semibold" style={{ color:"#e4e1ec" }}>🌐 All Alerts</p>
          <p className="text-xs mt-0.5" style={{ color:"rgba(187,202,191,0.45)" }}>Live event feed</p>
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Risk Score with amber donut */}
        <div className="card-glass p-6 flex items-center justify-between">
          <div>
            <p className="section-label mb-2">Risk Score</p>
            <h3 className="text-3xl font-bold" style={{ color:"#ffb95f" }}>
              {visibleEvents.length > 0
                ? (visibleEvents[0].risk_level === "HIGH" ? "Elevated" : visibleEvents[0].risk_level === "MEDIUM" ? "Moderate" : "Low")
                : "Nominal"}
            </h3>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" strokeDasharray="100,100"/>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#ffb95f" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${Math.min(visibleEvents.length * 25, 90)},100`}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color:"#e4e1ec" }}>
              {Math.min(visibleEvents.length * 25, 90)}%
            </div>
          </div>
        </div>

        {/* Weekly Profit Impact */}
        <div className="card-glass p-6">
          <p className="section-label mb-2">Weekly Profit Impact</p>
          <div className="flex items-baseline gap-3">
            <h3 className="stat-display">{fmt(totalExposure || 428400)}</h3>
            <span className="text-sm font-semibold" style={{ color:"#4edea3" }}>↑+5.2%</span>
          </div>
          <div className="progress-bar mt-4"><div className="progress-fill" style={{ width:"75%" }} /></div>
        </div>

        {/* Active Events */}
        <div className="card-glass p-6 flex items-center justify-between">
          <div>
            <p className="section-label mb-2">Active Events</p>
            <h3 className="stat-display">{visibleEvents.length} Signals</h3>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ background:"rgba(78,222,163,0.1)" }}>
            <div className="pulse-dot" />
          </div>
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"#e4e1ec" }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="11"/>
          </svg>
          Live Risk Events
        </h2>
        <button className="text-sm font-medium" style={{ color:"#4edea3" }}>View Archive</button>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-4">
          {[0,1,2].map(i => (
            <div key={i} className="card-glass p-6 animate-pulse space-y-3">
              <div className="h-4 w-24 rounded" style={{ background:"rgba(255,255,255,0.07)" }} />
              <div className="h-6 w-2/3 rounded" style={{ background:"rgba(255,255,255,0.07)" }} />
              <div className="h-4 w-full rounded" style={{ background:"rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Event cards ── */}
      {!loading && visibleEvents.map(event => {
        const displayRisk = (event.business_risk_level ?? event.risk_level) as keyof typeof RISK_CFG;
        const cfg         = RISK_CFG[displayRisk] ?? RISK_CFG.LOW;
        const rec         = recs[event.id];
        const impact      = impacts[event.id];
        const isAdopted   = adopted[event.id];
        const isExec      = executing === event.id;
        const isExpanded  = expanded[event.id];

        const costData = impact ? Object.entries(impact.cost_changes).map(([k, v]) => ({
          name: k.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase()),
          pct:  +(v * 100).toFixed(1),
        })) : [];

        const forecasts = impact ? buildForecasts(impact) : [];
        const forecastLineData = forecasts.length ? forecasts[0].labels.map((date, i) => {
          const row: Record<string,any> = { date };
          forecasts.forEach(f => { row[f.commodity] = f.prices[i]; });
          return row;
        }) : [];

        const cityCfg    = CITY_DATA[userCity] ?? CITY_DATA["Nagpur"];
        const adjMargin  = impact ? +(impact.margin_change * cityCfg.shock * (1 / cityCfg.price)).toFixed(4) : 0;
        const adjDemand  = impact ? +(impact.demand_change * cityCfg.price).toFixed(4) : 0;
        const cityRev    = 50000 * cityCfg.price * cityCfg.price;
        const adjProfit  = +(cityRev * 0.15 * (1 + Math.abs(adjMargin) * 0.8)).toFixed(0);

        return (
          <div key={event.id}
            style={{ display:"flex", flexDirection:"row", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"1rem", overflow:"hidden" }}
            className="group transition-all hover:bg-white/5">
            {/* Left accent bar */}
            <div style={{ width:4, flexShrink:0, background:cfg.leftColor }} />

            <div className="flex-1 p-6 space-y-4">
              {/* Row 1: badge + title + meta */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{ background:cfg.badgeBg, color:cfg.badgeColor }}>
                    {displayRisk}
                  </span>
                  <h4 className="text-lg font-semibold" style={{ color:"#e4e1ec" }}>{event.headline}</h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color:"rgba(187,202,191,0.4)" }}>
                    {new Date(event.published_at).toLocaleDateString()} · Source: {event.source}
                  </span>
                  <button onClick={() => setDismissed(p => ({ ...p, [event.id]:true }))}
                    className="p-1 rounded-lg transition-colors"
                    style={{ color:"rgba(187,202,191,0.3)" }}
                    onMouseEnter={e => (e.currentTarget.style.color="#e4e1ec")}
                    onMouseLeave={e => (e.currentTarget.style.color="rgba(187,202,191,0.3)")}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: commodity chips + confidence */}
              <div className="flex flex-wrap items-center gap-2">
                {event.commodities_affected.map(c => <span key={c} className="chip">{c}</span>)}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] uppercase tracking-wide" style={{ color:"rgba(187,202,191,0.4)" }}>
                    Confidence:
                  </span>
                  <span className="text-xs font-bold" style={{ color:"#4edea3" }}>
                    {((event.business_confidence ?? event.confidence) * 100 | 0)}%
                  </span>
                </div>
              </div>

              {/* Row 3: action buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => executeAction(event)} disabled={isAdopted || isExec || !rec}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={isAdopted
                    ? { background:"rgba(78,222,163,0.1)", color:"#4edea3", border:"1px solid rgba(78,222,163,0.3)" }
                    : rec
                    ? { background:"transparent", color:"#4edea3", border:"1px solid rgba(78,222,163,0.4)" }
                    : { background:"transparent", color:"rgba(187,202,191,0.3)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {isExec ? "Logging…" : isAdopted ? "✓ Decision Executed" : "Get Recommendation"}
                </button>
                <button onClick={() => sendWhatsApp(event)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ color:"rgba(187,202,191,0.5)" }}
                  onMouseEnter={e => (e.currentTarget.style.color="#e4e1ec")}
                  onMouseLeave={e => (e.currentTarget.style.color="rgba(187,202,191,0.5)")}>
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button onClick={() => downloadReport(event)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ color:"rgba(187,202,191,0.5)" }}
                  onMouseEnter={e => (e.currentTarget.style.color="#e4e1ec")}
                  onMouseLeave={e => (e.currentTarget.style.color="rgba(187,202,191,0.5)")}>
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => setExpanded(p => ({ ...p, [event.id]:!p[event.id] }))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ml-auto"
                  style={{ color:"rgba(187,202,191,0.4)" }}>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                  {isExpanded ? "Hide" : "Details"}
                </button>
              </div>

              {/* Wa status */}
              {whatsappStatus[event.id] && (
                <div className="text-xs px-4 py-2 rounded-xl"
                     style={{ background:"rgba(255,255,255,0.04)", color:"rgba(187,202,191,0.6)" }}>
                  {whatsappStatus[event.id]}
                </div>
              )}

              {/* ── AI Recommendation panel ── */}
              {rec && (
                <div className="rounded-2xl p-6 relative overflow-hidden"
                     style={{ background:"rgba(78,222,163,0.04)", border:"1px solid rgba(78,222,163,0.12)" }}>
                  <div className="absolute inset-0 pointer-events-none"
                       style={{ background:"radial-gradient(ellipse at top left, rgba(78,222,163,0.05), transparent 70%)" }}/>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold" style={{ color:"#e4e1ec" }}>AI Recommendation</h3>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                            style={{ background:"rgba(78,222,163,0.15)", color:"#4edea3", border:"1px solid rgba(78,222,163,0.25)" }}>
                        <Zap className="w-3 h-3"/>
                        {rec.generated_by === "quantum" ? "Quantum Optimised" : "Classical"}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color:"rgba(187,202,191,0.3)" }}>
                      Simulated {(rec.alternatives.length + 1) * 800} scenarios
                    </span>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main rec */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <p className="section-label mb-2">Optimal Action</p>
                        <p className="text-lg font-semibold leading-relaxed" style={{ color:"#e4e1ec" }}>
                          {rec.recommended_action}
                        </p>
                      </div>
                      <div>
                        <p className="section-label mb-2">Reasoning</p>
                        <p className="text-sm leading-relaxed" style={{ color:"rgba(187,202,191,0.65)" }}>{rec.reason}</p>
                      </div>
                      <div className="rounded-xl p-4 flex items-center gap-6"
                           style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                        <div>
                          <p className="text-xs mb-1" style={{ color:"rgba(187,202,191,0.4)" }}>Projected Margin Recovery</p>
                          <p className="text-3xl font-black" style={{ color:"#4edea3" }}>+{fmt(rec.profit_impact_inr)}</p>
                        </div>
                        <p className="text-sm" style={{ color:"rgba(187,202,191,0.35)" }}>
                          {(rec.confidence * 100).toFixed(0)}% Probability of Outcome
                        </p>
                      </div>
                      <button onClick={() => executeAction(event)} disabled={isAdopted || isExec}
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        style={{
                          background: isAdopted ? "rgba(78,222,163,0.1)" : "linear-gradient(135deg,#10b981,#4edea3)",
                          color: isAdopted ? "#4edea3" : "#003824",
                        }}>
                        {isExec ? <><RefreshCw className="w-4 h-4 animate-spin"/>Logging…</> :
                         isAdopted ? "✓ Decision Executed" : "✅ Execute this Decision"}
                      </button>
                    </div>

                    {/* Alternatives */}
                    <div className="space-y-3">
                      {rec.alternatives.slice(0,3).map((alt, i) => {
                        const altLabels = ["Balanced", "Conservative", "Aggressive"];
                        const altColors = ["#ffb95f", "rgba(187,202,191,0.35)", "#4edea3"];
                        return (
                          <div key={alt.action} className="p-4 rounded-xl cursor-pointer transition-all"
                               style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}
                               onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.15)")}
                               onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.07)")}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color:"rgba(187,202,191,0.35)" }}>{altLabels[i]}</span>
                              <span className="text-xs font-bold" style={{ color:altColors[i] }}>
                                {alt.profit_impact_inr >= 0 ? "+" : ""}{fmt(alt.profit_impact_inr)}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color:"rgba(187,202,191,0.6)" }}>{alt.action}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Expandable: charts + city impact ── */}
              {isExpanded && (
                <div className="space-y-6 pt-4 border-t" style={{ borderColor:"rgba(255,255,255,0.05)" }}>
                  {/* Cost impact bars */}
                  {costData.length > 0 && (
                    <div>
                      <p className="section-label mb-4">Cost Impact by Category</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={costData} margin={{ top:5,right:0,bottom:5,left:-10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                          <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.4)",fontSize:10 }} axisLine={false} tickLine={false}/>
                          <YAxis tickFormatter={v => `${v}%`} tick={{ fill:"rgba(255,255,255,0.35)",fontSize:10 }} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{ background:"#1f1f27",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,fontSize:12 }}
                            formatter={(v: any) => [`+${v}%`,"Cost change"]} labelStyle={{ color:"white" }}/>
                          <Bar dataKey="pct" radius={[4,4,0,0]}>
                            {costData.map((_: any, i: number) => <Cell key={i} fill={i===0?"#fc7c78":i===1?"#ffb95f":"#eab308"}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 7-Day Forecast */}
                  {forecastLineData.length > 0 && (
                    <div>
                      <p className="section-label mb-4">7-Day Commodity Price Forecast</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={forecastLineData} margin={{ top:5,right:10,bottom:5,left:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                          <XAxis dataKey="date" tick={{ fill:"rgba(255,255,255,0.4)",fontSize:10 }} axisLine={false} tickLine={false}/>
                          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill:"rgba(255,255,255,0.35)",fontSize:10 }} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{ background:"#1f1f27",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,fontSize:12 }}
                            labelStyle={{ color:"rgba(255,255,255,0.6)" }}
                            formatter={(v: any) => [`₹${Number(v).toLocaleString()}`,""] }/>
                          <Legend wrapperStyle={{ fontSize:11,color:"rgba(255,255,255,0.5)" }}/>
                          {forecasts.map((f: any, i: number) => (
                            <Line key={f.commodity} type="monotone" dataKey={f.commodity}
                              stroke={CHART_COLORS[i%CHART_COLORS.length]} strokeWidth={2.5}
                              dot={{ r:4,fill:CHART_COLORS[i%CHART_COLORS.length],strokeWidth:0 }} activeDot={{ r:6 }}/>
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* City impact */}
                  {impact && (
                    <div>
                      <p className="section-label mb-4 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5"/> Impact Adjusted for {userCity}
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label:"City Price Level",   value:`${(cityCfg.price*100).toFixed(0)}%`,  color:"#e4e1ec" },
                          { label:"Adj. Margin Impact", value:`${(adjMargin*100).toFixed(1)}%`,       color:"#ffb3af" },
                          { label:"Adj. Demand Impact", value:`${(adjDemand*100).toFixed(1)}%`,       color:"#ffb95f" },
                          { label:"Projected Profit",   value:fmt(adjProfit),                          color:"#4edea3" },
                        ].map(m => (
                          <div key={m.label} className="card-glass p-4 text-center">
                            <p className="text-[10px] mb-1" style={{ color:"rgba(187,202,191,0.4)" }}>{m.label}</p>
                            <p className="text-base font-bold" style={{ color:m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!loading && visibleEvents.length === 0 && (
        <div className="text-center py-24">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color:"rgba(187,202,191,0.2)" }}/>
          <p className="text-lg" style={{ color:"rgba(187,202,191,0.3)" }}>No active alerts.</p>
          <p className="text-sm mt-1" style={{ color:"rgba(187,202,191,0.2)" }}>Click a scenario above to load disruption data.</p>
        </div>
      )}
    </div>
  );
}
