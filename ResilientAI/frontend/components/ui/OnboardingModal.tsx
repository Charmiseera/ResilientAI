"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { CitySearch } from "@/components/ui/CitySearch";
import { User, Phone, MapPin, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

interface OnboardingModalProps {
  onComplete: () => void;
}


export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+91");
  const [city,    setCity]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city)  { setError("Name and city are required."); return; }
    setError(""); setLoading(true);

    try {
      // Get current Supabase auth user
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      const userId = user?.id ?? crypto.randomUUID();

      // Upsert into users table
      const { error: dbErr } = await supabaseBrowser.from("users").upsert({
        id:                userId,
        name:              name.trim(),
        phone:             phone.trim(),
        city:              city,
        business_type:     localStorage.getItem("rai_biz_type") || "kirana",
        weekly_revenue_inr: 50000,
        lang:              localStorage.getItem("rai_lang") || "en",
      });

      if (dbErr) throw new Error(dbErr.message);

      // Persist to localStorage for immediate use across tabs
      localStorage.setItem("rai_user_id", userId);
      localStorage.setItem("rai_city",    city);
      if (phone.length > 3) localStorage.setItem("rai_phone", phone.trim());
      localStorage.setItem("rai_onboarded", "true");

      onComplete();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Full-screen backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-3xl border border-white/[0.08] overflow-hidden"
        style={{ background: "#0d0d18", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-emerald-500" />

        <div className="p-7 space-y-6">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">👋 Welcome to ResilientAI</h2>
            <p className="text-white/40 text-sm">
              Tell us a little about yourself so we can personalise alerts and insights for your city and business.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <User className="w-3.5 h-3.5" /> Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text" required autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ramesh Sharma"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all text-sm"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <Phone className="w-3.5 h-3.5" /> WhatsApp Number
                <span className="text-white/25 text-[10px]">(for alerts — optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all text-sm"
              />
            </div>

            {/* City — Google Places autocomplete */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <MapPin className="w-3.5 h-3.5" /> Your City <span className="text-red-400">*</span>
              </label>
              <CitySearch
                value={city}
                onChange={setCity}
                placeholder="Search your city…"
                autoFocus={false}
              />
              {city && (
                <p className="text-emerald-400/70 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {city} — insights and alerts will be localised for you
                </p>
              )}
            </div>

            {/* WhatsApp preview */}
            {phone.length > 5 && (
              <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 flex items-start gap-2">
                <span className="text-lg">📱</span>
                <div>
                  <p className="text-emerald-300 text-xs font-semibold">WhatsApp Alerts Ready</p>
                  <p className="text-emerald-300/50 text-[10px] mt-0.5">
                    Risk alerts will be sent to <code className="text-emerald-300">{phone}</code>
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                ⚠️ {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Setting up…</>
              ) : (
                <>Let's go <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
