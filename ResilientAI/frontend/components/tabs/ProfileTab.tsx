"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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

    const { data: existing } = await supabase.from("users").select("id").eq("phone", form.phone).maybeSingle();
    const userId = existing?.id ?? crypto.randomUUID();

    await supabase.from("users").upsert({
      id:                userId,
      name:              form.name,
      city:              form.city,
      phone:             form.phone,
      business_type:     form.business_type,
      weekly_revenue_inr: form.weekly_revenue,
      lang:              form.lang,
    });

    localStorage.setItem("rai_user_id",  userId);
    localStorage.setItem("rai_lang",     form.lang);
    localStorage.setItem("rai_biz_type", form.business_type);
    localStorage.setItem("rai_city",     form.city);
    if (form.phone) localStorage.setItem("rai_phone", form.phone);

    setLoading(false);
    setSaved(true);
    loadAllProfiles();
    setTimeout(() => setSaved(false), 3500);
  }

  const selectedBiz = BIZ_TYPES.find(b => b.value === form.business_type);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">🏪 My Business Profile</h1>
        <p className="text-white/40 text-sm mt-1">Set up once — get personalized alerts forever.</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ═══════════════ LEFT — FORM ═══════════════ */}
        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Step 1 + 2 merged in a horizontal grid ── */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-5">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">
              About You
            </p>

            {/* Name + Phone side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <User className="w-3.5 h-3.5" /> Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ramesh Sharma"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <Phone className="w-3.5 h-3.5" /> WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+919876543210"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all text-sm"
                />
              </div>
            </div>

            {/* City + Language side by side */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <MapPin className="w-3.5 h-3.5" /> City <span className="text-red-400">*</span>
                </label>
                <CitySearch
                  value={form.city}
                  onChange={city => setForm({ ...form, city })}
                  placeholder="Search your city…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <Globe className="w-3.5 h-3.5" /> Preferred Language
                </label>
                <div className="flex gap-2 h-[42px]">
                  {(["en", "hi"] as Lang[]).map(l => (
                    <button
                      key={l} type="button"
                      onClick={() => setForm({ ...form, lang: l })}
                      className={`flex-1 rounded-xl text-sm font-semibold border transition-all ${
                        form.lang === l
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                          : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {l === "en" ? "🇬🇧 EN" : "🇮🇳 हिं"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Business section ── */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-5">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">
              Your Business
            </p>

            {/* Business type as pill selector */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <Briefcase className="w-3.5 h-3.5" /> Business Type <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BIZ_TYPES.map(b => (
                  <button
                    key={b.value} type="button"
                    onClick={() => setForm({ ...form, business_type: b.value })}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      form.business_type === b.value
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                    }`}
                  >
                    {b.emoji} {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <Building2 className="w-3.5 h-3.5" /> Weekly Revenue
                </label>
                <span className="text-white font-bold text-sm">₹{form.weekly_revenue.toLocaleString()}</span>
              </div>
              <div className="relative h-2">
                <div className="absolute inset-0 bg-white/10 rounded-full" />
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                  style={{ width: `${((form.weekly_revenue - 5000) / 995000) * 100}%` }}
                />
                <input
                  type="range" min={5000} max={1000000} step={5000}
                  value={form.weekly_revenue}
                  onChange={e => setForm({ ...form, weekly_revenue: Number(e.target.value) })}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/20">
                <span>₹5K</span><span>₹10L</span>
              </div>
            </div>
          </div>

          {/* ── Alert preferences ── */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">
              Alert Preferences
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <Bell className="w-3.5 h-3.5" /> Alert me when risk is at least
              </label>
              <div className="flex gap-2">
                {ALERT_LEVELS.map(level => {
                  const colors: Record<AlertLevel, string> = {
                    LOW:    "border-emerald-500/50 bg-emerald-500/20 text-emerald-300",
                    MEDIUM: "border-amber-500/50  bg-amber-500/20  text-amber-300",
                    HIGH:   "border-red-500/50    bg-red-500/20    text-red-300",
                  };
                  return (
                    <button
                      key={level} type="button"
                      onClick={() => setForm({ ...form, alert_level: level })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.alert_level === level ? colors[level] : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/60"
                      }`}
                    >
                      {level === "LOW" ? "🟢" : level === "MEDIUM" ? "🟡" : "🔴"} {level}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/25">
                WhatsApp alerts for <strong className="text-white/40">{form.alert_level}</strong> and above events.
              </p>
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit" disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[0.98]"
            } disabled:opacity-50`}
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
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-semibold">
              Your Profile Preview
            </p>

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {form.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-white font-semibold">{form.name || <span className="text-white/20">Your Name</span>}</p>
                <p className="text-white/40 text-xs">{form.city || <span className="text-white/20">City</span>}</p>
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
                <div key={s.label} className="bg-white/[0.04] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1 text-white/30">
                    <s.icon className="w-3 h-3" />
                    <span className="text-[10px]">{s.label}</span>
                  </div>
                  <p className="text-white text-xs font-medium truncate">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Alert badge */}
            <div className={`rounded-xl p-3 flex items-center gap-2 text-xs font-medium border ${
              form.alert_level === "HIGH"
                ? "bg-red-500/10 border-red-500/20 text-red-300"
                : form.alert_level === "MEDIUM"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            }`}>
              <Bell className="w-3.5 h-3.5 flex-shrink-0" />
              Alerts at <strong className="ml-1">{form.alert_level}</strong> &amp; above
            </div>

            {/* WhatsApp status */}
            {form.phone && (
              <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 flex items-start gap-2">
                <span className="text-lg">📱</span>
                <div>
                  <p className="text-emerald-300 text-xs font-semibold">WhatsApp Ready</p>
                  <p className="text-emerald-300/50 text-[10px] mt-0.5 break-all">{form.phone}</p>
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
            <div className="flex items-center gap-2 text-white/30">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                Registered Users {profiles.length > 0 && `(${profiles.length})`}
              </span>
              {fetchingUsers && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
            </div>

            {profiles.length === 0 && !fetchingUsers && (
              <p className="text-white/20 text-xs">No users yet — be first!</p>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                    {p.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-white/30 text-[10px] truncate">{p.business_type} · {p.city}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/40 text-[10px]">₹{((p.weekly_revenue_inr || 0) / 1000).toFixed(0)}K/wk</p>
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
