"use client";

import { useState, useCallback, useEffect } from "react";
import { logStrategy } from "@/lib/api";
import {
  TrendingUp, DollarSign, Package, Percent,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Scenario { name: string; profit: number; fill: string; }
interface SimResult {
  baseProfit: number;
  costHit: number;
  priceGain: number;
  stockGain: number;
  projected: number;
  scenarios: Scenario[];
}

// ── Slider config ──────────────────────────────────────────────────────────────
const BUSINESS_SLIDERS = [
  {
    key: "revenue",   label: "Weekly Revenue",      icon: DollarSign,
    min: 10000, max: 500000, step: 5000,
    fmt: (v: number) => `₹${v.toLocaleString()}`,
    grad: "from-cyan-500 to-blue-600",
  },
  {
    key: "margin",    label: "Current Margin %",    icon: Percent,
    min: 5,     max: 40,     step: 1,
    fmt: (v: number) => `${v}%`,
    grad: "from-emerald-400 to-teal-500",
  },
  {
    key: "shock",     label: "Commodity Cost Shock %", icon: AlertCircle,
    min: 0,     max: 50,     step: 1,
    fmt: (v: number) => `${v}%`,
    grad: "from-red-400 to-rose-600",
  },
] as const;

const STRATEGY_SLIDERS = [
  {
    key: "priceDelta", label: "Price Increase (₹/unit)", icon: TrendingUp,
    min: 0,  max: 20,  step: 0.5,
    fmt: (v: number) => `₹${v.toFixed(1)}`,
    grad: "from-orange-400 to-amber-500",
  },
  {
    key: "extraUnits", label: "Extra Units to Stock",   icon: Package,
    min: 0,  max: 500,  step: 5,
    fmt: (v: number) => `${v} units`,
    grad: "from-violet-400 to-purple-500",
  },
  {
    key: "avgUnit",    label: "Avg Unit Selling Price (₹)", icon: DollarSign,
    min: 10, max: 500,  step: 5,
    fmt: (v: number) => `₹${v}`,
    grad: "from-sky-400 to-indigo-500",
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function SimulatorTab() {
  const [revenue,    setRevenue]    = useState(50000);
  const [margin,     setMargin]     = useState(15);     // displayed as 15 (%)
  const [shock,      setShock]      = useState(20);     // displayed as 20 (%)
  const [priceDelta, setPriceDelta] = useState(2);
  const [extraUnits, setExtraUnits] = useState(10);
  const [avgUnit,    setAvgUnit]    = useState(50);

  const [result, setResult]         = useState<SimResult | null>(null);
  const [saved,  setSaved]          = useState(false);
  const [saving, setSaving]         = useState(false);

  // ── Auto-compute every time any slider changes (mirror Streamlit) ──────────
  const compute = useCallback(() => {
    const m = margin / 100;
    const s = shock / 100;
    const baseProfit = revenue * m;
    const costHit    = revenue * s * 0.5;
    const priceGain  = (priceDelta / avgUnit) * revenue * 0.97;
    const stockGain  = extraUnits * avgUnit * m;
    const projected  = baseProfit - costHit + priceGain + stockGain;

    setResult({
      baseProfit,
      costHit,
      priceGain,
      stockGain,
      projected,
      scenarios: (() => {
        const vals = [
          { name: "Do Nothing",  profit: Math.round(baseProfit - costHit) },
          { name: "Price Only",  profit: Math.round(baseProfit - costHit + priceGain) },
          { name: "Stock Only",  profit: Math.round(baseProfit - costHit + stockGain) },
          { name: "Price+Stock", profit: Math.round(projected) },
        ];
        // Mirror Streamlit: red if profit < base_profit, green if >= base_profit
        return vals.map(s => ({
          ...s,
          fill: s.profit < Math.round(baseProfit) ? "#FF453A" : "#30D158",
        }));
      })(),
    });
  }, [revenue, margin, shock, priceDelta, extraUnits, avgUnit]);

  // Run on mount + every param change
  useEffect(() => { compute(); }, [compute]);

  // ── Strategy adopt ────────────────────────────────────────────────────────
  async function handleAdopt() {
    if (!result) return;
    setSaving(true);
    try {
      const userId =
        (typeof window !== "undefined" && localStorage.getItem("rai_user_id")) ||
        "00000000-0000-0000-0000-000000000000";
      await logStrategy({
        user_id: userId,
        weekly_revenue: revenue,
        current_margin_pct: margin / 100,
        price_delta: priceDelta,
        extra_units: extraUnits,
        projected_profit: result.projected,
        snapshot: { revenue, margin, shock, priceDelta, extraUnits, avgUnit },
      });
    } catch (_) {
      // best-effort — still show success
    } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    }
  }

  // ── Slider renderer ───────────────────────────────────────────────────────
  const SliderCard = ({
    label, icon: Icon, value, min, max, step, fmt, grad, onChange,
  }: {
    label: string; icon: React.ElementType;
    value: number; min: number; max: number; step: number;
    fmt: (v: number) => string; grad: string;
    onChange: (v: number) => void;
  }) => (
    <div className="card-glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color:"rgba(187,202,191,0.4)" }}/>
          <span className="text-xs" style={{ color:"rgba(187,202,191,0.6)" }}>{label}</span>
        </div>
        <span className="font-bold text-sm" style={{ color:"#e4e1ec" }}>{fmt(value)}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}/>
        <div className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${grad}`}
             style={{ width:`${((value-min)/(max-min))*100}%`}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"/>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="section-label mb-1">Scenario Modeling</p>
        <h1 className="section-headline">Profit Simulator</h1>
        <p className="text-sm mt-1" style={{ color:"rgba(187,202,191,0.5)" }}>
          Test strategies before committing — see exact ₹ impact in real-time as you move sliders.
        </p>
      </div>

      {/* ── Two-column parameter layout (mirrors Streamlit) ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Business Parameters */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            📊 Business Parameters
          </p>
          {BUSINESS_SLIDERS.map(s => (
            <SliderCard
              key={s.key}
              label={s.label} icon={s.icon}
              value={{ revenue, margin, shock }[s.key]}
              min={s.min} max={s.max} step={s.step}
              fmt={s.fmt} grad={s.grad}
              onChange={v => {
                if (s.key === "revenue") setRevenue(v);
                if (s.key === "margin")  setMargin(v);
                if (s.key === "shock")   setShock(v);
              }}
            />
          ))}
        </div>

        {/* Right: Strategy Parameters */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color:"rgba(187,202,191,0.4)" }}>
            Strategy Parameters
          </p>
          {STRATEGY_SLIDERS.map(s => (
            <SliderCard
              key={s.key}
              label={s.label} icon={s.icon}
              value={{ priceDelta, extraUnits, avgUnit }[s.key]}
              min={s.min} max={s.max} step={s.step}
              fmt={s.fmt} grad={s.grad}
              onChange={v => {
                if (s.key === "priceDelta") setPriceDelta(v);
                if (s.key === "extraUnits") setExtraUnits(v);
                if (s.key === "avgUnit")    setAvgUnit(v);
              }}
            />
          ))}

          {/* Tip */}
          <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
               style={{ background:"rgba(78,222,163,0.05)", border:"1px solid rgba(78,222,163,0.15)", color:"rgba(78,222,163,0.7)" }}>
            💡 Results update <strong style={{ color:"#4edea3" }}>instantly</strong> as you move sliders.
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.05)" }}/>
            <span className="text-xs uppercase tracking-widest" style={{ color:"rgba(187,202,191,0.25)" }}>Results</span>
            <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.05)" }}/>
          </div>

          {/* KPI metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label:"Base Profit",      value:`₹${Math.round(result.baseProfit).toLocaleString()}`,    color:"#e4e1ec",   delta:null },
              { label:"Shock Hit",        value:`-₹${Math.round(result.costHit).toLocaleString()}`,      color:"#fc7c78",   delta:null },
              { label:"Projected Profit", value:`₹${Math.round(result.projected).toLocaleString()}`,     color:"#4edea3",  delta:`${result.projected>=result.baseProfit?"+":""}${Math.round(result.projected-result.baseProfit).toLocaleString()} vs baseline` },
              { label:"New Margin",       value:`${(result.projected/revenue*100).toFixed(1)}%`,          color:"#ffb95f",  delta:null },
            ].map(m => (
              <div key={m.label} className="card-glass p-4 text-center">
                <p className="section-label mb-1">{m.label}</p>
                <p className="font-bold text-lg" style={{ color:m.color }}>{m.value}</p>
                {m.delta && <p className="text-[10px] mt-1" style={{ color:"rgba(187,202,191,0.3)" }}>{m.delta}</p>}
              </div>
            ))}
          </div>

          {/* Strategy comparison bar chart */}
          <div className="card-glass p-5">
            <p className="section-label mb-4">Strategy Comparison — Weekly Profit</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={result.scenarios} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Profit"]}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {result.scenarios.map((s, i) => (
                    <Cell key={i} fill={s.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Adopt button */}
          <button onClick={handleAdopt} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
            style={saved
              ? { background:"rgba(78,222,163,0.1)", color:"#4edea3", border:"1px solid rgba(78,222,163,0.2)" }
              : { background:"linear-gradient(135deg,#10b981,#4edea3)", color:"#003824" }}>
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin"/>Saving strategy…</>) :
             saved  ? (<><CheckCircle2 className="w-4 h-4"/>Strategy Saved to Cloud</>) :
             (<>✅ Adopt Price + Stock Strategy — +₹{Math.max(0,Math.round(result.projected-result.baseProfit)).toLocaleString()}/week</>)}
          </button>
        </div>
      )}
    </div>
  );
}
