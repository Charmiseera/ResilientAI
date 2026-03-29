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

// ── Types ──────────────────────────────────────────────────────────────────────
const RISK_CFG = {
  HIGH:   { color:"text-red-400",    bg:"bg-red-500/10",    border:"border-red-500/30",    dot:"bg-red-500",    pulse:true  },
  MEDIUM: { color:"text-orange-400", bg:"bg-orange-500/10", border:"border-orange-500/25", dot:"bg-orange-500", pulse:false },
  LOW:    { color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/20", dot:"bg-yellow-500", pulse:false },
};

const SCENARIOS = [
  { id:"evt_001", label:"🔥 Hormuz Disruption",   sub:"LPG +20%, Transport +12%",   color:"from-red-600/20 to-orange-600/10"   },
  { id:"evt_002", label:"🌾 Ukraine Grain Crisis", sub:"Wheat +15%, Edible Oil +10%", color:"from-yellow-600/20 to-amber-600/10" },
  { id:"evt_003", label:"⚡ Taiwan Blockade",       sub:"Electronics +30%, Semi +25%", color:"from-violet-600/20 to-blue-600/10" },
];

const CITY_DATA: Record<string, { tier:number; price:number; shock:number; state:string }> = {
  Mumbai:            { tier:1, price:1.18, shock:0.85, state:"Maharashtra"   },
  Delhi:             { tier:1, price:1.15, shock:0.80, state:"Delhi"         },
  Bangalore:         { tier:1, price:1.12, shock:0.82, state:"Karnataka"     },
  Nagpur:            { tier:2, price:1.00, shock:1.00, state:"Maharashtra"   },
  Jaipur:            { tier:2, price:0.95, shock:1.05, state:"Rajasthan"     },
  "Rural Maharashtra":{ tier:3, price:0.82, shock:1.25, state:"Maharashtra" },
};

const CHART_COLORS = ["#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

// ── Helpers ────────────────────────────────────────────────────────────────────
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

  // Read city from user profile (set during onboarding / Profile tab)
  const userCity = (typeof window !== "undefined" && localStorage.getItem("rai_city")) || "Nagpur";

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

  const userId = () =>
    (typeof window !== "undefined" && localStorage.getItem("rai_user_id")) ||
    "00000000-0000-0000-0000-000000000000";
  const userPhone = () =>
    (typeof window !== "undefined" && localStorage.getItem("rai_phone")) ?? "";

  // loadScenario accepts bizType explicitly — never reads stale React state
  const loadScenario = useCallback(async (
    eventId?: string,
    bizType: string = businessType,
  ) => {
    setLoading(true);
    // Clear stale data when business type changes
    setRecs({});
    setImpacts({});
    setDismissed({});
    try {
      const res = await getAlerts("LOW", bizType);
      const all  = eventId ? res.filter(e => e.id === eventId) : res;
      const list = all.length ? all : res;
      setEvents(list);
      setBackendOk(true);

      await Promise.all(list.map(async e => {
        const [rec, imp] = await Promise.allSettled([
          getRecommendation(e.id, bizType),
          getImpact(e.id, bizType) as Promise<ImpactResponse>,
        ]);
        if (rec.status === "fulfilled") setRecs(p  => ({ ...p, [e.id]: rec.value }));
        if (imp.status === "fulfilled") setImpacts(p => ({ ...p, [e.id]: imp.value as ImpactResponse }));
      }));
    } catch { setBackendOk(false); }
    finally  { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
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
    const url = `${API_BASE}/report?event_id=${event.id}&business_type=${businessType}`;
    // Build POST body and fetch as blob
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
          <h1 className="text-2xl font-bold text-white">Risk Intelligence</h1>
          <p className="text-white/40 text-sm mt-1">Real-time disruptions → Quantum-optimised decisions → Local impact</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Backend status pill */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
            backendOk ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <span className={`w-2 h-2 rounded-full ${backendOk ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            {backendOk ? "Backend Live" : "Backend Offline"}
          </div>

          {/* Business type — pass new value DIRECTLY to avoid stale closure */}
          <select value={businessType} onChange={e => {
            const newBiz = e.target.value;
            setBizType(newBiz);
            loadScenario(activeScenario ?? undefined, newBiz);
          }}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none cursor-pointer">
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
            className={`p-4 rounded-2xl border text-left transition-all bg-gradient-to-br ${s.color} ${
              activeScenario === s.id ? "border-emerald-500/40 ring-1 ring-emerald-500/30" : "border-white/10 hover:border-white/20"
            }`}>
            <p className="text-white font-semibold text-sm">{s.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.sub}</p>
          </button>
        ))}
        <button onClick={() => { setScenario(null); loadScenario(undefined, businessType); setExpanded({}); }}
          className="p-4 rounded-2xl border border-white/10 hover:border-white/20 text-left transition-all bg-white/[0.03]">
          <p className="text-white font-semibold text-sm">🌐 All Alerts</p>
          <p className="text-white/40 text-xs mt-0.5">Live event feed</p>
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Active Threats",      value:visibleEvents.length.toString(),                    icon:AlertTriangle, color:"text-red-400",     bg:"bg-red-500/10"     },
          { label:"7-Day Profit Upside", value:fmt(totalExposure),                                 icon:TrendingDown,  color:"text-emerald-400", bg:"bg-emerald-500/10" },
          { label:"Decisions Logged",    value:Object.keys(adopted).length.toString(),             icon:CheckCircle2,  color:"text-cyan-400",    bg:"bg-cyan-500/10"    },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon className={`w-6 h-6 ${k.color}`} />
            </div>
            <div>
              <p className="text-white/40 text-xs">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-4">
          {[0,1].map(i => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 animate-pulse space-y-3">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-6 w-2/3 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/10 rounded" />
              <div className="h-4 w-4/5 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ── Event cards ── */}
      {!loading && visibleEvents.map(event => {
        // Use business-adjusted risk level for display (not the global event level)
        const displayRisk = (event.business_risk_level ?? event.risk_level) as keyof typeof RISK_CFG;
        const cfg     = RISK_CFG[displayRisk] ?? RISK_CFG.LOW;
        const rec     = recs[event.id];
        const impact  = impacts[event.id];
        const isAdopted   = adopted[event.id];
        const isExec      = executing === event.id;
        const isExpanded  = expanded[event.id];

        // Chart data
        const costData = impact ? Object.entries(impact.cost_changes).map(([k, v]) => ({
          name: k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          pct:  +(v * 100).toFixed(1),
        })) : [];

        const baseProfit = 7500;
        const projProfit = rec?.profit_impact_inr ?? baseProfit;
        const strategyData = [
          { name: "Do Nothing",  profit: Math.round(baseProfit * 0.78), fill: "#ef4444" },
          { name: "Price Only",  profit: Math.round(baseProfit * 0.92), fill: "#f97316" },
          { name: "Stock Only",  profit: Math.round(baseProfit * 1.04), fill: "#eab308" },
          { name: "AI Strategy", profit: Math.round(projProfit),        fill: "#10b981" },
        ];

        const forecasts = impact ? buildForecasts(impact) : [];
        const forecastLineData = forecasts.length ? forecasts[0].labels.map((date, i) => {
          const row: Record<string,any> = { date };
          forecasts.forEach(f => { row[f.commodity] = f.prices[i]; });
          return row;
        }) : [];

        // City-adjusted impact
        const cityCfg = CITY_DATA[userCity] ?? CITY_DATA["Nagpur"];
        const adjMargin  = impact ? +(impact.margin_change * cityCfg.shock * (1 / cityCfg.price)).toFixed(4) : 0;
        const adjDemand  = impact ? +(impact.demand_change * cityCfg.price).toFixed(4) : 0;
        const cityRevenue = 50000 * cityCfg.price * cityCfg.price;
        const adjProfit  = +(cityRevenue * 0.15 * (1 + Math.abs(adjMargin) * 0.8)).toFixed(0);

        return (
          <div key={event.id} className={`bg-white/[0.03] border ${cfg.border} rounded-2xl overflow-hidden`}>

            {/* ── Banner — uses business_risk_level, not global risk_level ── */}
            <div className={`px-6 pt-5 pb-4 border-b ${cfg.border} bg-gradient-to-r ${
              displayRisk === "HIGH" ? "from-red-500/10 to-transparent" :
              displayRisk === "MEDIUM" ? "from-orange-500/10 to-transparent" :
              "from-yellow-500/5 to-transparent"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Business-adjusted risk badge */}
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${cfg.bg} ${cfg.color}`}>
                    {cfg.pulse && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />}
                    {!cfg.pulse && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                    {displayRisk} RISK
                  </span>
                  {/* Show global risk only if it differs from business-adjusted */}
                  {event.business_risk_level && event.business_risk_level !== event.risk_level && (
                    <span className="text-[10px] text-white/25 px-1.5 py-0.5 rounded bg-white/5">
                      Global: {event.risk_level}
                    </span>
                  )}
                  <span className="text-white/30 text-xs flex items-center gap-1"><Globe className="w-3 h-3" />{event.source}</span>
                  <span className="text-white/30 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />{new Date(event.published_at).toLocaleDateString()}
                  </span>
                  <span className="text-white/30 text-xs">{(event.business_confidence ?? event.confidence) * 100 | 0}% relevance</span>
                  {event.business_sensitivity !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      event.business_sensitivity >= 1.0 ? 'bg-red-500/15 text-red-400'
                      : event.business_sensitivity >= 0.5 ? 'bg-orange-500/15 text-orange-400'
                      : 'bg-white/10 text-white/30'
                    }`}>
                      {businessType} sensitivity: {(event.business_sensitivity * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <button onClick={() => setDismissed(p => ({ ...p, [event.id]:true }))}
                  className="text-white/20 hover:text-white/60 p-1 rounded-lg hover:bg-white/5 transition-all shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-white font-bold text-xl mt-3 mb-1">{event.headline}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {event.commodities_affected.map(c => (
                  <span key={c} className="text-[10px] font-medium bg-white/5 text-white/50 px-2 py-0.5 rounded-md border border-white/5">{c}</span>
                ))}
              </div>
            </div>

            {/* ── Two-column: charts + rec card ── */}
            <div className="p-6 grid lg:grid-cols-2 gap-6">

              {/* Left: Cost Impact Chart */}
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
                  📊 Cost Impact by Category
                </p>
                {costData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={costData} margin={{ top:5, right:0, bottom:5, left:-10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.4)", fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fill:"rgba(255,255,255,0.35)", fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:"#111827", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, fontSize:12 }}
                        formatter={(v: any) => [`+${v}%`, "Cost change"]} labelStyle={{ color:"white" }} />
                      <Bar dataKey="pct" radius={[4,4,0,0]}
                        label={{ position:"top", fill:"rgba(255,100,100,0.7)", fontSize:10, formatter:(v: number) => `+${v}%` }}>
                        {costData.map((_, i) => <Cell key={i} fill={i === 0 ? "#ef4444" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : CHART_COLORS[i] } />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">No impact data</div>
                )}
              </div>

              {/* Right: AI Recommendation Card */}
              <div>
                {rec ? (
                  <div className="h-full bg-white/[0.04] border border-white/8 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Recommended Action
                      </p>
                      <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                        rec.generated_by === "quantum"
                          ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                          : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                      }`}>
                        {rec.generated_by === "quantum" ? <FlaskConical className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                        {rec.generated_by === "quantum" ? "Quantum QAOA" : "Classical"} · {(rec.confidence*100).toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <h4 className="text-cyan-400 text-xl font-bold">{rec.recommended_action}</h4>
                      <p className="text-white/70 text-sm mt-1">{rec.description}</p>
                    </div>

                    <div className="bg-black/20 rounded-xl p-3 text-white/40 text-xs leading-relaxed border border-white/5">
                      📝 {rec.reason}
                    </div>

                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Estimated 7-day profit impact</p>
                      <p className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        +{fmt(rec.profit_impact_inr)}
                      </p>
                    </div>

                    {rec.alternatives.length > 0 && (
                      <details className="group">
                        <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 list-none flex items-center gap-1">
                          <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                          📋 View all {rec.alternatives.length + 1} options
                        </summary>
                        <div className="mt-2 space-y-1">
                          {rec.alternatives.map(a => (
                            <div key={a.action} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                              <span className="text-white/60">{a.action}</span>
                              <div className="flex gap-3">
                                <span className="text-emerald-400 font-medium">{fmt(a.profit_impact_inr)}</span>
                                <span className="text-orange-400">{(a.risk_score*100).toFixed(0)}% risk</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/20 text-sm rounded-2xl border border-white/5 bg-white/[0.02]">
                    {loading ? "Loading…" : "Recommendation unavailable"}
                  </div>
                )}
              </div>
            </div>

            {/* ── Profit Impact Metrics Row ── */}
            {rec && impact && (
              <div className="px-6 pb-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">📈 Profit Impact Snapshot</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label:"Projected Profit/wk",  value: fmt(rec.profit_impact_inr),      sub:`+${fmt(rec.profit_impact_inr - 7500)} vs baseline`, color:"text-emerald-400" },
                    { label:"Margin Impact",          value:`${(impact.margin_change*100).toFixed(1)}%`, sub:"Net margin shift",  color:"text-red-400"     },
                    { label:"Demand Change",          value:`${(impact.demand_change*100).toFixed(1)}%`, sub:"Consumer demand",   color:"text-orange-400"  },
                    { label:"Options Evaluated",      value:`${rec.alternatives.length + 1}`, sub:"Strategies scored",    color:"text-white"       },
                  ].map(m => (
                    <div key={m.label} className="bg-white/[0.04] border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-white/30 mb-1">{m.label}</p>
                      <p className={`font-bold text-base ${m.color}`}>{m.value}</p>
                      <p className="text-[10px] text-white/20 mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="px-6 pb-4 flex flex-wrap gap-3">
              <button onClick={() => executeAction(event)} disabled={isAdopted || isExec || !rec}
                className={`flex-1 min-w-[140px] py-3 rounded-xl font-semibold text-sm transition-all ${
                  isAdopted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                  : isExec ? "bg-white/5 text-white/40 cursor-wait"
                  : rec ? "bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[.99]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"}`}>
                {isExec ? "Logging…" : isAdopted ? "✓ Decision Executed" : "✅ Accept Recommendation"}
              </button>

              <button onClick={() => sendWhatsApp(event)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-all">
                <MessageSquare className="w-4 h-4" />
                📱 WhatsApp Alert
              </button>

              <button onClick={() => downloadReport(event)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-all">
                <Download className="w-4 h-4" />
                Download CSV
              </button>

              <button onClick={() => setExpanded(p => ({ ...p, [event.id]: !p[event.id] }))}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white text-sm transition-all">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isExpanded ? "Hide" : "Show"} Forecasts
              </button>
            </div>

            {/* WhatsApp status */}
            {whatsappStatus[event.id] && (
              <div className="mx-6 mb-4 bg-white/[0.04] border border-white/5 rounded-xl px-4 py-2 text-xs text-white/60">
                {whatsappStatus[event.id]}
              </div>
            )}

            {/* ── Expandable: City Impact + 7-Day Forecast + Peak Cards ── */}
            {isExpanded && (
              <div className="border-t border-white/5 bg-white/[0.015] px-6 py-6 space-y-6">

                {/* City-Adjusted Impact */}
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Impact Adjusted for {userCity}
                    <span className="text-[10px] text-white/20 normal-case">
                      (Tier {CITY_DATA[userCity]?.tier} · {CITY_DATA[userCity]?.state})
                    </span>
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label:"City Price Level",  value:`${(cityCfg.price*100).toFixed(0)}%`,        sub:"vs national avg",  color:"text-white"       },
                      { label:"Adj. Margin Impact",value:`${(adjMargin*100).toFixed(1)}%`,             sub:"city-adjusted",    color:"text-red-400"     },
                      { label:"Adj. Demand Impact",value:`${(adjDemand*100).toFixed(1)}%`,             sub:"city-adjusted",    color:"text-orange-400"  },
                      { label:"Projected Profit",  value:fmt(adjProfit),                               sub:"7-day estimate",   color:"text-emerald-400" },
                    ].map(m => (
                      <div key={m.label} className="bg-white/[0.04] border border-white/5 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-white/30 mb-1">{m.label}</p>
                        <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
                        <p className="text-[10px] text-white/20 mt-0.5">{m.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Price Forecast Chart */}
                {forecastLineData.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
                      📈 7-Day Commodity Price Forecast
                    </p>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={forecastLineData} margin={{ top:5, right:10, bottom:5, left:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fill:"rgba(255,255,255,0.4)", fontSize:10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill:"rgba(255,255,255,0.35)", fontSize:10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background:"#111827", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, fontSize:12 }}
                          labelStyle={{ color:"rgba(255,255,255,0.6)" }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, ""]}
                        />
                        <Legend wrapperStyle={{ fontSize:11, color:"rgba(255,255,255,0.5)" }} />
                        {forecasts.map((f, i) => (
                          <Line key={f.commodity} type="monotone" dataKey={f.commodity}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5}
                            dot={{ r:4, fill: CHART_COLORS[i % CHART_COLORS.length], strokeWidth:0 }}
                            activeDot={{ r:6 }} />
                        ))}
                        {/* Baseline reference lines */}
                        {forecasts.map((f, i) => (
                          <Line key={`${f.commodity}_base`} type="monotone"
                            data={forecastLineData.map(d => ({ ...d, [`${f.commodity}_base`]: f.baseline }))}
                            dataKey={`${f.commodity}_base`}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth={1} strokeDasharray="4 4" opacity={0.4} dot={false} legendType="none" />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Peak Price Warning Cards */}
                {forecasts.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
                      ⚠️ Peak Price Warnings
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {forecasts.map((f, i) => (
                        <div key={f.commodity}
                          className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 text-center">
                          <p className="text-white/40 text-xs mb-1">{f.commodity}</p>
                          <p className="text-red-400 font-black text-2xl">
                            ₹{f.peakPrice.toLocaleString("en-IN", { maximumFractionDigits:1 })}
                            <span className="text-xs text-white/30 font-normal">/{f.unit}</span>
                          </p>
                          <p className="text-orange-400 text-xs mt-1">
                            Peak Day {f.peakDay} · +{(f.shock * 100 * 1.15).toFixed(0)}% shock
                          </p>
                          <p className="text-white/25 text-xs mt-0.5">
                            ₹{f.baseline.toLocaleString()} baseline
                          </p>
                          {/* Mini spark bar */}
                          <div className="flex items-end gap-0.5 justify-center mt-2 h-6">
                            {f.prices.map((p, d) => (
                              <div key={d}
                                style={{ height:`${Math.round((p / f.peakPrice) * 24)}px` }}
                                className={`w-2.5 rounded-sm ${d === f.peakDay - 1 ? "bg-red-400" : "bg-white/15"}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!loading && visibleEvents.length === 0 && (
        <div className="text-center py-24 text-white/20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No active alerts.</p>
          <p className="text-sm">Click a scenario above to load disruption data.</p>
        </div>
      )}
    </div>
  );
}
