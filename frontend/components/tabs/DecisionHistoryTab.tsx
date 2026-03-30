"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, TrendingUp, Clock, Star,
  MessageSquare, ChevronDown, ChevronUp, Loader2, Send,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Decision {
  id: string;
  event_id: string;
  business_type: string;
  action_taken: string;
  profit_impact_inr: number;
  engine: string;
  timestamp: string;
  feedback?: string | null;
  outcome_rating?: number | null;
  feedback_at?: string | null;
}

interface Strategy {
  id: string;
  weekly_revenue: number;
  current_margin_pct: number;
  price_delta: number;
  projected_profit: number;
  timestamp: string;
}

// ── Star Rating sub-component ─────────────────────────────────────────────────
function StarRating({
  value, onChange, disabled,
}: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-white/15"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Feedback inline form ───────────────────────────────────────────────────────
function FeedbackPanel({
  decision,
  onSaved,
}: {
  decision: Decision;
  onSaved: (updated: Decision) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [rating,  setRating]  = useState(decision.outcome_rating ?? 0);
  const [text,    setText]    = useState(decision.feedback ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(!!decision.feedback);
  const [error,   setError]   = useState("");

  const alreadyHasFeedback = !!decision.feedback;

  async function handleSubmit() {
    if (!rating) { setError("Please select a star rating."); return; }
    if (!text.trim()) { setError("Please write a brief outcome note."); return; }
    setError("");
    setSaving(true);

    try {
      // Write directly to Supabase from the frontend
      const { data, error: sbErr } = await supabase
        .from("decisions")
        .update({
          feedback:       text.trim(),
          outcome_rating: rating,
          feedback_at:    new Date().toISOString(),
        })
        .eq("id", decision.id)
        .select()
        .single();

      if (sbErr) throw new Error(sbErr.message);

      setSaved(true);
      setOpen(false);
      onSaved({ ...decision, feedback: text.trim(), outcome_rating: rating, feedback_at: new Date().toISOString() });
    } catch (e: any) {
      setError(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Already has feedback — show summary + edit toggle ──────────────────────
  if (saved || alreadyHasFeedback) {
    return (
      <div className="mt-3 pt-3 border-t border-white/5">
        {!open ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star
                    key={n}
                    className={`w-3.5 h-3.5 ${n <= (decision.outcome_rating ?? rating) ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
                  />
                ))}
              </div>
              <p className="text-white/40 text-xs italic line-clamp-1">
                "{decision.feedback ?? text}"
              </p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="text-[10px] text-white/25 hover:text-white/60 underline transition-colors flex-shrink-0"
            >
              Edit feedback
            </button>
          </div>
        ) : (
          <FeedbackForm
            rating={rating} setRating={setRating}
            text={text} setText={setText}
            saving={saving} error={error}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            isEdit
          />
        )}
      </div>
    );
  }

  // ── No feedback yet — show CTA or form ──────────────────────────────────────
  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
            border border-dashed border-white/10 text-white/30 hover:text-white/60
            hover:border-white/20 text-xs transition-all group"
        >
          <MessageSquare className="w-3.5 h-3.5 group-hover:text-emerald-400 transition-colors" />
          Add outcome feedback
        </button>
      ) : (
        <FeedbackForm
          rating={rating} setRating={setRating}
          text={text} setText={setText}
          saving={saving} error={error}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── Shared form UI ────────────────────────────────────────────────────────────
function FeedbackForm({
  rating, setRating, text, setText,
  saving, error, onSubmit, onCancel, isEdit,
}: {
  rating: number; setRating: (n: number) => void;
  text: string; setText: (s: string) => void;
  saving: boolean; error: string;
  onSubmit: () => void; onCancel: () => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">
        {isEdit ? "✏️ Edit Outcome Feedback" : "📋 How did this recommendation work out?"}
      </p>
      {/* Star rating */}
      <div className="space-y-1">
        <p className="text-[10px] text-white/30">Rate the outcome</p>
        <StarRating value={rating} onChange={setRating} />
        <p className="text-[9px] text-white/20">
          {["", "Poor — didn't help", "Below expectations", "Okay — partial benefit", "Good — worked well", "Excellent — exceeded expectations"][rating] ?? ""}
        </p>
      </div>
      {/* Text feedback */}
      <textarea
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What happened after you implemented this? Any actual profit change, supplier response, or other outcome…"
        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white/80
          text-xs placeholder:text-white/20 outline-none resize-none
          focus:border-emerald-500/30 focus:bg-white/[0.06] transition-all"
      />
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            bg-emerald-500 text-black text-xs font-bold
            hover:bg-emerald-400 active:scale-[.98] disabled:opacity-50 transition-all"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
            : <><Send className="w-3.5 h-3.5" />{isEdit ? "Update" : "Submit Feedback"}</>
          }
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-xl border border-white/10 text-white/30
            hover:text-white text-xs transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export function DecisionHistoryTab() {
  const [decisions,  setDecisions]  = useState<Decision[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"decisions" | "strategies">("decisions");

  const load = useCallback(async () => {
    setLoading(true);
    const userId = localStorage.getItem("rai_user_id") || "00000000-0000-0000-0000-000000000000";
    const [d, s] = await Promise.all([
      supabase.from("decisions").select("*").eq("user_id", userId).order("timestamp", { ascending: false }).limit(30),
      supabase.from("adopted_strategies").select("*").eq("user_id", userId).order("timestamp", { ascending: false }).limit(20),
    ]);
    setDecisions(d.data ?? []);
    setStrategies(s.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Optimistic update after feedback saved
  function handleFeedbackSaved(updated: Decision) {
    setDecisions(ds => ds.map(d => d.id === updated.id ? updated : d));
  }

  // Stats
  const rated    = decisions.filter(d => d.outcome_rating);
  const avgRating = rated.length
    ? (rated.reduce((s, d) => s + (d.outcome_rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";
  const totalProfit = decisions.reduce((s, d) => s + (d.profit_impact_inr ?? 0), 0);
  const feedbackPct = decisions.length
    ? Math.round((rated.length / decisions.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="section-label mb-1">Audit Timeline</p>
        <h1 className="section-headline">Decision History</h1>
        <p className="text-sm mt-1" style={{ color:"rgba(187,202,191,0.5)" }}>
          Complete audit trail — accepted recommendations and adopted strategies with outcome feedback.
        </p>
      </div>

      {/* Stats strip */}
      {!loading && decisions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Decisions Logged",   value: decisions.length.toString(),          color: "#e4e1ec" },
            { label: "Total Profit Impact", value: `₹${Math.round(totalProfit).toLocaleString()}`, color: "#4edea3" },
            { label: "Avg Outcome Rating",  value: avgRating === "—" ? "—" : `★ ${avgRating}`, color: "#ffb95f" },
            { label: "Feedback Rate",       value: `${feedbackPct}%`,                    color: "#06b6d4" }, // cyan
          ].map(s => (
            <div key={s.label} className="card-glass p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider" style={{ color:"rgba(187,202,191,0.35)" }}>{s.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
        {(["decisions", "strategies"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === t ? "#e4e1ec" : "rgba(187,202,191,0.35)",
            }}
          >
            {t === "decisions"
              ? `✅ Recommendations (${decisions.length})`
              : `📈 Strategies (${strategies.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-white/30 text-sm h-40 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading from cloud…
        </div>
      ) : tab === "decisions" ? (
        /* ── Executed Decisions ── */
        <div className="space-y-3">
          {decisions.length === 0 && (
            <div className="card-glass p-10 text-sm text-center" style={{ color:"rgba(187,202,191,0.3)" }}>
              No decisions logged yet. Execute recommendations in the Intelligence tab.
            </div>
          )}
          {decisions.map(d => (
            <div
              key={d.id}
              className="card-glass p-5 space-y-1 transition-all"
              style={{
                borderLeft: d.feedback ? "3px solid #4edea3" : "3px solid transparent"
              }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm capitalize" style={{ color:"#e4e1ec" }}>
                      {d.event_id.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: d.engine === "quantum" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)",
                        color: d.engine === "quantum" ? "#c4b5fd" : "#93c5fd"
                      }}>
                      {d.engine === "quantum" ? "⚛ Quantum" : "🧠 Classical"}
                    </span>
                    {d.feedback && (
                      <span className="text-[10px] flex items-center gap-1" style={{ color:"rgba(78,222,163,0.7)" }}>
                        <CheckCircle2 className="w-3 h-3" /> Feedback given
                      </span>
                    )}
                  </div>
                  <p className="text-xs capitalize" style={{ color:"rgba(187,202,191,0.5)" }}>{d.business_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color:"#4edea3" }}>
                    +₹{Math.abs(d.profit_impact_inr).toLocaleString()}
                  </p>
                  <p className="text-[10px] flex items-center gap-1 justify-end mt-0.5" style={{ color:"rgba(187,202,191,0.2)" }}>
                    <Clock className="w-3 h-3" />
                    {new Date(d.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {/* Action taken */}
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color:"rgba(187,202,191,0.4)" }}>{d.action_taken}</p>

              {/* Feedback panel */}
              <FeedbackPanel decision={d} onSaved={handleFeedbackSaved} />
            </div>
          ))}
        </div>
      ) : (
        /* ── Adopted Strategies ── */
        <div className="space-y-3">
          {strategies.length === 0 && (
            <div className="card-glass p-10 text-sm text-center" style={{ color:"rgba(187,202,191,0.3)" }}>
              No strategies saved yet. Use the Profit Simulator to adopt strategies.
            </div>
          )}
          {strategies.map(s => (
            <div key={s.id} className="card-glass p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm" style={{ color:"#e4e1ec" }}>
                  Strategy @ {(s.current_margin_pct * 100).toFixed(0)}% margin
                </span>
                <span className="font-bold text-sm" style={{ color:"#4edea3" }}>
                  ₹{Math.round(s.projected_profit).toLocaleString()}/wk
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Revenue",   value: `₹${(s.weekly_revenue / 1000).toFixed(0)}K` },
                  { label: "Price ↑",   value: `₹${s.price_delta}/unit` },
                  { label: "Margin",    value: `${(s.current_margin_pct * 100).toFixed(0)}%` },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-2.5 text-center" style={{ background:"rgba(255,255,255,0.04)" }}>
                    <p className="text-[10px]" style={{ color:"rgba(187,202,191,0.3)" }}>{m.label}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color:"#e4e1ec" }}>{m.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] flex items-center gap-1" style={{ color:"rgba(187,202,191,0.2)" }}>
                <Clock className="w-3 h-3" />
                {new Date(s.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
