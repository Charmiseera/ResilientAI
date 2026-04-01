"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { CitySearch } from "@/components/ui/CitySearch";
import {
  User, Building2, Phone, MapPin, Briefcase, Save,
  Globe, Bell, Users, CheckCircle2, Loader2, TrendingUp, Shield, Zap,
} from "lucide-react";

type Lang       = "en" | "hi";
type AlertLevel = "LOW" | "MEDIUM" | "HIGH";
type BizType    = "kirana" | "restaurant" | "pharma" | "logistics" | "manufacturing";

interface Profile {
  id: string;
  name: string;
  city: string;
  phone: string;
  business_type: string;
  weekly_revenue_inr: number;
  lang: string;
}

const BIZ_TYPES: { value: BizType; label: string; emoji: string }[] = [
  { value: "kirana",        label: "General Retail",    emoji: "🛒" },
  { value: "restaurant",    label: "Restaurant",        emoji: "🍽️" },
  { value: "pharma",        label: "Pharmaceuticals",   emoji: "💊" },
  { value: "logistics",     label: "Freight & Logistics", emoji: "🚛" },
  { value: "manufacturing", label: "Manufacturing",     emoji: "🏭" },
];

const ALERT_LEVELS: AlertLevel[] = ["LOW", "MEDIUM", "HIGH"];

export function ProfileTab() {
  const [form, setForm] = useState({
    name:           "",
    phone:          "",
    city:           "",
    business_type:  "kirana" as BizType,
    weekly_revenue: 50000,
    lang:           "en" as Lang,
    alert_level:    "MEDIUM" as AlertLevel,
  });

  const [loading,      setLoading]      = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [profiles,     setProfiles]     = useState<Profile[]>([]);
  const [fetchingUsers,setFetchingUsers] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("rai_user_id");
    if (id) loadMyProfile(id);
    loadAllProfiles();
  }, []);

  async function loadMyProfile(id: string) {
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    if (data) {
      setForm(prev => ({
        ...prev,
        name:           data.name           || "",
        phone:          data.phone          || "",
        city:           data.city           || "",
        business_type:  data.business_type  || "kirana",
        weekly_revenue: data.weekly_revenue_inr || 50000,
        lang:           (data.lang as Lang) || "en",
      }));
    }
  }

  async function loadAllProfiles() {
    setFetchingUsers(true);
    const { data } = await supabase
      .from("users")
      .select("id,name,city,phone,business_type,weekly_revenue_inr,lang")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setProfiles(data);
    setFetchingUsers(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) return;
    setLoading(true);

    try {
      // Prefer the currently authenticated user's ID so we always update the same row
      const { data: { user: authUser } } = await supabaseBrowser.auth.getUser();
      let userId = authUser?.id ?? (localStorage.getItem("rai_user_id") || "");

      // If no auth id (shouldn't happen), fall back to phone lookup
      if (!userId && form.phone) {
        const { data: byPhone } = await supabase
          .from("users").select("id").eq("phone", form.phone).maybeSingle();
        userId = byPhone?.id ?? crypto.randomUUID();
      }
      if (!userId) userId = crypto.randomUUID();

      const { error: dbErr } = await supabase.from("users").upsert(
        {
          id:                userId,
          name:              form.name,
          city:              form.city,
          phone:             form.phone || null,
          business_type:     form.business_type,
          weekly_revenue_inr: form.weekly_revenue,
          lang:              form.lang,
        },
        { onConflict: "id" }
      );

      if (dbErr) throw dbErr;

      localStorage.setItem("rai_user_id",  userId);
      localStorage.setItem("rai_lang",     form.lang);
      localStorage.setItem("rai_biz_type", form.business_type);
      localStorage.setItem("rai_city",     form.city);
      if (form.phone) localStorage.setItem("rai_phone", form.phone);

      setSaved(true);
      loadAllProfiles();
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      console.error("Profile save error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedBiz = BIZ_TYPES.find(b => b.value === form.business_type);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <p className="section-label mb-1">Configuration</p>
        <h1 className="section-headline">🏪 My Business Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-glass-text-dim)" }}>Set up once — get personalized alerts forever.</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ═══════════════ LEFT — FORM ═══════════════ */}
        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Step 1 + 2 merged in a horizontal grid ── */}
          <div className="card-glass p-6 space-y-5">
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-glass-text-dim)" }}>
              About You
            </p>

            {/* Name + Phone side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                  <User className="w-3.5 h-3.5" /> Full Name <span style={{ color:"#fc7c78" }}>*</span>
                </label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ramesh Sharma"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                  style={{ background: "var(--color-glass-border)", border: "1px solid var(--color-glass-border)", color: "var(--color-rai-text)" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                  <Phone className="w-3.5 h-3.5" /> WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+919876543210"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                  style={{ background: "var(--color-glass-border)", border: "1px solid var(--color-glass-border)", color: "var(--color-rai-text)" }}
                />
              </div>
            </div>

            {/* City + Language side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                  <MapPin className="w-3.5 h-3.5" /> City <span style={{ color:"#fc7c78" }}>*</span>
                </label>
                <CitySearch
                  value={form.city}
                  onChange={city => setForm({ ...form, city })}
                  placeholder="Search your city…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                  <Globe className="w-3.5 h-3.5" /> Preferred Language
                </label>
                <div className="flex gap-2 h-[42px]">
                  {(["en", "hi"] as Lang[]).map(l => (
                    <button
                      key={l} type="button"
                      onClick={() => setForm({ ...form, lang: l })}
                      className="flex-1 rounded-xl text-sm font-semibold border transition-all"
                      style={{
                        background: form.lang === l ? "rgba(78,222,163,0.15)" : "rgba(255,255,255,0.03)",
                        border: form.lang === l ? "1px solid rgba(78,222,163,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        color: form.lang === l ? "#4edea3" : "rgba(187,202,191,0.4)"
                      }}
                    >
                      {l === "en" ? "🇬🇧 EN" : "🇮🇳 हिं"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Business section ── */}
          <div className="card-glass p-6 space-y-5">
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-glass-text-dim)" }}>
              Your Business
            </p>

            {/* Business type as pill selector */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                <Briefcase className="w-3.5 h-3.5" /> Business Type <span style={{ color:"#fc7c78" }}>*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BIZ_TYPES.map(b => (
                  <button
                    key={b.value} type="button"
                    onClick={() => setForm({ ...form, business_type: b.value })}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      background: form.business_type === b.value ? "rgba(78,222,163,0.15)" : "rgba(255,255,255,0.03)",
                      border: form.business_type === b.value ? "1px solid rgba(78,222,163,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      color: form.business_type === b.value ? "#4edea3" : "rgba(187,202,191,0.4)"
                    }}
                  >
                    {b.emoji} {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                  <Building2 className="w-3.5 h-3.5" /> Weekly Revenue
                </label>
                <span className="font-bold text-sm" style={{ color: "var(--color-rai-text)" }}>₹{form.weekly_revenue.toLocaleString()}</span>
              </div>
              <div className="relative h-2">
                <div className="absolute inset-0 rounded-full" style={{ background: "var(--color-glass-border)" }} />
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ width: `${((form.weekly_revenue - 5000) / 995000) * 100}%`, background:"#4edea3" }}
                />
                <input
                  type="range" min={5000} max={1000000} step={5000}
                  value={form.weekly_revenue}
                  onChange={e => setForm({ ...form, weekly_revenue: Number(e.target.value) })}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: "var(--color-glass-text-dim)" }}>
                <span>₹5K</span><span>₹10L</span>
              </div>
            </div>
          </div>

          {/* ── Alert preferences ── */}
          <div className="card-glass p-6 space-y-4">
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-glass-text-dim)" }}>
              Alert Preferences
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-glass-text-dim)" }}>
                <Bell className="w-3.5 h-3.5" /> Alert me when risk is at least
              </label>
              <div className="flex gap-2">
                {ALERT_LEVELS.map(level => {
                  const colors = {
                    LOW:    { bg:"rgba(78,222,163,0.15)", border:"rgba(78,222,163,0.4)", color:"#4edea3" },
                    MEDIUM: { bg:"rgba(255,185,95,0.15)", border:"rgba(255,185,95,0.4)", color:"#ffb95f" },
                    HIGH:   { bg:"rgba(252,124,120,0.15)", border:"rgba(252,124,120,0.4)", color:"#fc7c78" },
                  };
                  return (
                    <button
                      key={level} type="button"
                      onClick={() => setForm({ ...form, alert_level: level })}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        background: form.alert_level === level ? colors[level].bg : "rgba(255,255,255,0.03)",
                        border: form.alert_level === level ? `1px solid ${colors[level].border}` : "1px solid rgba(255,255,255,0.08)",
                        color: form.alert_level === level ? colors[level].color : "rgba(187,202,191,0.4)",
                      }}
                    >
                      {level === "LOW" ? "🟢" : level === "MEDIUM" ? "🟡" : "🔴"} {level}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px]" style={{ color: "var(--color-glass-text-dim)" }}>
                WhatsApp alerts for <strong style={{ color: "var(--color-glass-text-dim)" }}>{form.alert_level}</strong> and above events.
              </p>
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: saved ? "rgba(78,222,163,0.15)" : "#4edea3",
              color: saved ? "#4edea3" : "#000",
              border: saved ? "1px solid rgba(78,222,163,0.3)" : "none",
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" />Profile Saved! WhatsApp Alerts Active</>
            ) : (
              <><Save className="w-4 h-4" />💾 Save Profile & Enable WhatsApp Alerts</>
            )}
          </button>
        </form>

        {/* ═══════════════ RIGHT — SUMMARY + USERS ═══════════════ */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* Live Profile Card */}
          <div className="card-glass p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-glass-text-dim)" }}>
              Your Profile Preview
            </p>

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                   style={{ background:"#4edea3", color:"#000" }}>
                {form.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--color-rai-text)" }}>{form.name || <span style={{ color: "var(--color-glass-text-dim)" }}>Your Name</span>}</p>
                <p className="text-xs" style={{ color: "var(--color-glass-text-dim)" }}>{form.city || <span style={{ color: "var(--color-glass-text-dim)" }}>City</span>}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Briefcase,   label: "Business",  value: selectedBiz ? `${selectedBiz.emoji} ${selectedBiz.label}` : "—" },
                { icon: TrendingUp,  label: "Revenue",   value: `₹${form.weekly_revenue.toLocaleString()}/wk` },
                { icon: Phone,       label: "WhatsApp",  value: form.phone || "Not set" },
                { icon: Globe,       label: "Language",  value: form.lang === "en" ? "🇬🇧 English" : "🇮🇳 हिंदी" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 space-y-1" style={{ background: "var(--color-glass-border)" }}>
                  <div className="flex items-center gap-1" style={{ color: "var(--color-glass-text-dim)" }}>
                    <s.icon className="w-3 h-3" />
                    <span className="text-[10px]">{s.label}</span>
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: "var(--color-rai-text)" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Alert badge */}
            <div className="rounded-xl p-3 flex items-center gap-2 text-xs font-medium border"
                 style={{
                    background: form.alert_level === "HIGH" ? "rgba(252,124,120,0.15)" : form.alert_level === "MEDIUM" ? "rgba(255,185,95,0.15)" : "rgba(78,222,163,0.15)",
                    border: form.alert_level === "HIGH" ? "1px solid rgba(252,124,120,0.3)" : form.alert_level === "MEDIUM" ? "1px solid rgba(255,185,95,0.3)" : "1px solid rgba(78,222,163,0.3)",
                    color: form.alert_level === "HIGH" ? "#fc7c78" : form.alert_level === "MEDIUM" ? "#ffb95f" : "#4edea3"
                 }}>
              <Bell className="w-3.5 h-3.5 flex-shrink-0" />
              Alerts at <strong className="ml-1">{form.alert_level}</strong> &amp; above
            </div>

            {/* WhatsApp status */}
            {form.phone && (
              <div className="rounded-xl p-3 flex items-start gap-2"
                   style={{ background:"rgba(78,222,163,0.1)", border:"1px solid rgba(78,222,163,0.2)" }}>
                <span className="text-lg">📱</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color:"#4edea3" }}>WhatsApp Ready</p>
                  <p className="text-[10px] mt-0.5 break-all" style={{ color:"rgba(78,222,163,0.6)" }}>{form.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Feature chips */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Zap,    label: "AI Alerts",       color: "text-cyan-400",    bg: "bg-cyan-400/10"    },
              { icon: Shield, label: "Quantum Engine",  color: "text-violet-400",  bg: "bg-violet-400/10"  },
              { icon: TrendingUp, label: "Profit Sim",  color: "text-emerald-400", bg: "bg-emerald-400/10" },
            ].map(f => (
              <div key={f.label} className={`${f.bg} rounded-xl p-3 text-center space-y-1`}>
                <f.icon className={`w-4 h-4 mx-auto ${f.color}`} />
                <p className={`text-[9px] font-semibold ${f.color}`}>{f.label}</p>
              </div>
            ))}
          </div>

          {/* Registered Users */}
          <div className="space-y-3">
            <div className="flex items-center gap-2" style={{ color: "var(--color-glass-text-dim)" }}>
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Registered Users {profiles.length > 0 && `(${profiles.length})`}
              </span>
              {fetchingUsers && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
            </div>

            {profiles.length === 0 && !fetchingUsers && (
              <p className="text-xs" style={{ color: "var(--color-glass-text-dim)" }}>No users yet — be first!</p>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="card-glass px-3 py-2.5 flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                       style={{ background: "var(--color-glass-border)", color: "var(--color-rai-text)" }}>
                    {p.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--color-rai-text)" }}>{p.name}</p>
                    <p className="text-[10px] truncate" style={{ color: "var(--color-glass-text-dim)" }}>{p.business_type} · {p.city}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px]" style={{ color: "var(--color-glass-text-dim)" }}>₹{((p.weekly_revenue_inr || 0) / 1000).toFixed(0)}K/wk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
