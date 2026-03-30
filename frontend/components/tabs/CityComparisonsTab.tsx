"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, RefreshCw, TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import { CitySearch } from "@/components/ui/CitySearch";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

const TIER_COLORS: Record<number, string> = { 1: "#10b981", 2: "#f97316", 3: "#ef4444" };
const TIER_LABELS: Record<number, string>  = { 1: "Metro",    2: "City",    3: "Rural"  };

const DEFAULT_CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad"];

interface CityResult {
  city: string;
  tier: number;
  state: string;
  adjusted_margin_change: number;
  adjusted_demand_change: number;
  adjusted_profit_inr: number;
  price_multiplier: number;
  shock_absorption: number;
  adjusted_cost_changes: Record<string, number>;
  ai_generated: boolean;
  ai_rationale: string;
}

const EVENTS = [
  { id: "evt_001", label: "🔥 Hormuz Disruption" },
  { id: "evt_002", label: "🌾 Ukraine Grain Crisis" },
  { id: "evt_003", label: "⚡ Taiwan Blockade" },
];

export function CityComparisonsTab() {
  const [selected, setSelected]   = useState<string[]>(DEFAULT_CITIES);
  const [eventId, setEventId]     = useState("evt_001");
  const [searchCity, setSearchCity] = useState("");
  const [weeklyRev, setRevenue]   = useState(50000);
  const [results, setResults]     = useState<CityResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const fetchComparisons = useCallback(async () => {
    if (selected.length === 0) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          business_type: "kirana",
          cities: selected,
          weekly_revenue: weeklyRev,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResults(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }, [selected, weeklyRev, eventId, API]);

  useEffect(() => { fetchComparisons(); }, [eventId]);

  function addCity(city: string) {
    if (!city.trim() || selected.includes(city) || selected.length >= 6) return;
    setSelected(prev => [...prev, city]);
    setSearchCity("");
  }

  function removeCity(city: string) {
    setSelected(prev => prev.filter(c => c !== city));
  }

  const best  = results.length ? results.reduce((a, b) => a.adjusted_profit_inr > b.adjusted_profit_inr ? a : b) : null;
  const worst = results.length ? results.reduce((a, b) => a.adjusted_profit_inr < b.adjusted_profit_inr ? a : b) : null;

  const radarData = results.map(r => ({
    city: r.city.split(" ")[0],
    "Price Level":  Math.round(r.price_multiplier * 100),
    "Shock Factor": Math.round(r.shock_absorption * 100),
    "Profit":       Math.round(r.adjusted_profit_inr / 100),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-1">Regional Intelligence</p>
        <h1 className="section-headline">City Comparisons</h1>
        <p className="text-sm mt-1" style={{ color:"rgba(187,202,191,0.5)" }}>
          How does a supply disruption hit differently across Indian cities? Powered by Gemini AI for any city.
        </p>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4">
          
          <div className="grid sm:grid-cols-2 gap-4 pb-2">
            {/* Scenario selector */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
                Scenario
              </p>
              <select
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all text-sm appearance-none"
              >
                {EVENTS.map(evt => (
                  <option key={evt.id} value={evt.id} className="bg-gray-900 text-white">
                    {evt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search input */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Add Cities</span>
                <span className="text-white/25 normal-case">({selected.length}/6)</span>
              </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <CitySearch
                  value={searchCity}
                  onChange={city => {
                    setSearchCity(city);
                    // Auto-add when a city is selected from the dropdown
                    if (city && !selected.includes(city) && selected.length < 6) {
                      setSelected(prev => [...prev, city]);
                      // Clear input after short delay so user sees the selection
                      setTimeout(() => setSearchCity(""), 100);
                    }
                  }}
                  placeholder="Search any Indian city…"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Selected city chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(city => (
                <div
                  key={city}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium"
                >
                  <MapPin className="w-3 h-3 opacity-60" />
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="ml-0.5 text-emerald-400/50 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selected.length === 0 && (
            <p className="text-white/20 text-xs">
              Search and add cities above to compare supply chain impact.
            </p>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Weekly Revenue</p>
            <p className="text-white font-bold text-lg">₹{weeklyRev.toLocaleString()}</p>
            <div className="relative h-2 mt-2">
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                style={{ width:`${((weeklyRev-10000)/490000)*100}%` }} />
              <input type="range" min={10000} max={500000} step={5000} value={weeklyRev}
                onChange={e => setRevenue(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
          </div>
          <button onClick={fetchComparisons} disabled={loading || selected.length === 0}
            className="py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Compare Cities
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Profit bar chart */}
      {results.length > 0 && (
        <>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-4">
              Projected 7-Day Profit by City ({EVENTS.find(e => e.id === eventId)?.label.split(" ").slice(1).join(" ")})
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={results} margin={{ top:5, right:10, bottom:5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" tick={{ fill:"rgba(255,255,255,0.5)", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(1)}K`} tick={{ fill:"rgba(255,255,255,0.4)", fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8 }}
                  formatter={(v: any)=>[`₹${Number(v || 0).toLocaleString()}`,"Projected Profit"]} />
                <Bar dataKey="adjusted_profit_inr" radius={[4,4,0,0]}
                  label={{ position:"top", fill:"rgba(255,255,255,0.4)", fontSize:10, formatter:(v: any)=>`₹${(Number(v || 0)/1000).toFixed(1)}K` }}>
                  {results.map((r, i) => (
                    <Cell key={i} fill={TIER_COLORS[r.tier] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              {Object.entries(TIER_COLORS).map(([tier, color]) => (
                <span key={tier} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                  Tier {tier} ({TIER_LABELS[Number(tier)]})
                </span>
              ))}
            </div>
          </div>

          {/* Best/Worst insight banner */}
          {best && worst && best.city !== worst.city && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm">
              <span className="text-emerald-400 font-semibold">💡 Best outcome:</span>{" "}
              <span className="text-white">{best.city} (₹{best.adjusted_profit_inr.toLocaleString()})</span>
              {" · "}
              <span className="text-orange-400 font-semibold">Most affected:</span>{" "}
              <span className="text-white">{worst.city} (₹{worst.adjusted_profit_inr.toLocaleString()})</span>
              {" — "}
              <span className="text-white/60">
                {Math.abs(((best.adjusted_profit_inr - worst.adjusted_profit_inr) / worst.adjusted_profit_inr) * 100).toFixed(0)}% gap between metro and rural MSMEs
              </span>
            </div>
          )}

          {/* City detail cards — mirrors Streamlit exactly */}
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest mb-4">📊 City Breakdown</p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map(r => {
                const tc = TIER_COLORS[r.tier] || "#6b7280";
                return (
                  <div key={r.city} className="card-glass p-5 space-y-4" style={{ borderLeft: `3px solid ${tc}` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: tc }} />
                          <span className="font-semibold" style={{ color:"#e4e1ec" }}>{r.city}</span>
                          {r.ai_generated && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background:"rgba(78,222,163,0.12)", color:"#4edea3", border:"1px solid rgba(78,222,163,0.2)" }}>
                              ✦ AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color:"rgba(187,202,191,0.35)" }}>{r.state}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ color: tc, background: `${tc}20` }}>
                        TIER {r.tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { label:"Price Level",  value:`${(r.price_multiplier*100).toFixed(0)}%`,          color:"#e4e1ec"     },
                        { label:"Margin Hit",   value:`${(r.adjusted_margin_change*100).toFixed(1)}%`,    color:"#fc7c78"     },
                        { label:"Demand",       value:`${(r.adjusted_demand_change*100).toFixed(1)}%`,    color:"#ffb95f"     },
                        { label:"Profit/wk",   value:`₹${r.adjusted_profit_inr.toLocaleString(undefined,{maximumFractionDigits:0})}`, color:"#4edea3" },
                      ].map(m => (
                        <div key={m.label} className="rounded-xl p-2.5 text-center" style={{ background:"rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] mb-0.5" style={{ color:"rgba(187,202,191,0.35)" }}>{m.label}</p>
                          <p className="font-bold text-sm" style={{ color:m.color }}>{m.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1">
                      <p className="text-[10px] mb-1" style={{ color:"rgba(187,202,191,0.3)" }}>Shock absorption</p>
                      <div className="w-full h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{
                          width:`${Math.min(100, (r.shock_absorption / 1.5) * 100)}%`,
                          background: r.shock_absorption < 1 ? "#4edea3" : "#fc7c78"
                        }} />
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color:"rgba(187,202,191,0.25)" }}>
                        {r.shock_absorption < 1 ? "Fast recovery (metro)" : "Slow recovery (inland)"}
                      </p>
                    </div>

                    {/* AI rationale */}
                    {r.ai_rationale && (
                      <div className="pt-1 rounded-xl p-3 text-xs leading-relaxed"
                           style={{ background:"rgba(78,222,163,0.05)", border:"1px solid rgba(78,222,163,0.12)", color:"rgba(187,202,191,0.6)" }}>
                        <span style={{ color:"#4edea3",fontWeight:600 }}>✦ Gemini: </span>
                        {r.ai_rationale}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm" style={{ color:"rgba(78,222,163,0.7)" }}>
            <span className="animate-spin">✦</span>
            Gemini AI is analyzing {selected.length} {selected.length === 1 ? "city" : "cities"}…
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {selected.map(c => (
              <div key={c} className="card-glass p-5 animate-pulse h-52" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
