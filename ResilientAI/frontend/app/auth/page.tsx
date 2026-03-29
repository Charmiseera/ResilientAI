"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Loader2, Mail, Lock, Eye, EyeOff, Zap, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

type Mode = "signin" | "signup" | "forgot";

const FEATURES = [
  { icon: Zap,        label: "Live AI Alerts",       desc: "Real-time supply chain intelligence" },
  { icon: Shield,     label: "Quantum Optimization",  desc: "QAOA-powered decision engine" },
  { icon: TrendingUp, label: "Profit Simulator",      desc: "Scenario modeling in ₹" },
];

export default function AuthPage() {
  const searchParams  = useSearchParams();
  const callbackError = searchParams.get("error");

  const [mode,        setMode]     = useState<Mode>("signin");
  const [email,       setEmail]    = useState("");
  const [password,    setPassword] = useState("");
  const [showPass,    setShowPass] = useState(false);
  const [loading,     setLoading]  = useState(false);
  const [googleLoad,  setGoogleLoad] = useState(false);
  const [error,       setError]    = useState(callbackError ? "Authentication failed. Please try again." : "");
  const [success,     setSuccess]  = useState("");

  // Clear errors on mode switch
  useEffect(() => { setError(""); setSuccess(""); }, [mode]);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoad(true);
    setError("");
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) { setError(error.message); setGoogleLoad(false); }
    // Page will redirect — no need to setGoogleLoad(false) on success
  }

  // ── Email / Password ──────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        });
        if (error) throw error;
        setSuccess("Password reset email sent! Check your inbox.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
        setLoading(false);
        return;
      }

      // Sign in
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Middleware will redirect to /
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#08080f] p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-4xl grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/[0.07]"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
      >
        {/* ═══════════ LEFT — Branding Panel ═══════════ */}
        <div
          className="hidden lg:flex flex-col justify-between p-10"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">R</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-none">ResilientAI</p>
                <p className="text-white/40 text-xs">AURA Intelligence</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white leading-tight">
              Supply chain intelligence<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                for every MSME
              </span>
            </h2>
            <p className="text-white/40 text-sm mt-3 leading-relaxed">
              Real-time disruption alerts, quantum-optimized decisions, and profit simulation — built for Indian businesses.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{f.label}</p>
                  <p className="text-white/35 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <p className="text-white/20 text-xs">
            Trusted by kirana stores, restaurants & pharmacies across India
          </p>
        </div>

        {/* ═══════════ RIGHT — Auth Form ═══════════ */}
        <div className="flex flex-col justify-center p-8 lg:p-10 bg-[#0a0a14]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-black">R</span>
            </div>
            <p className="text-white font-bold">ResilientAI</p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white">
              {mode === "signin"  ? "Welcome back"          :
               mode === "signup"  ? "Create your account"   :
               "Reset your password"}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {mode === "signin"  ? "Sign in to your dashboard"   :
               mode === "signup"  ? "Start your free account today" :
               "We'll send you a reset link"}
            </p>
          </div>

          {/* Google Sign-In (not for forgot) */}
          {mode !== "forgot" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={googleLoad || loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm font-medium hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {googleLoad ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  /* Google G SVG */
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-white/25 text-xs">or continue with email</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </>
          )}

          {/* Error / Success banners */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-300 text-sm flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {success}
            </div>
          )}

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-white/50">
                <Mail className="w-3.5 h-3.5" /> Email address
              </label>
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all text-sm"
              />
            </div>

            {/* Password (hidden for forgot mode) */}
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Forgot link — only in signin */}
                {mode === "signin" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-white/30 hover:text-cyan-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoad}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Please wait…</>
              ) : mode === "signin" ? "Sign In →" :
                 mode === "signup" ? "Create Account →" :
                 "Send Reset Email →"}
            </button>
          </form>

          {/* Mode switcher */}
          <p className="text-center text-sm text-white/30 mt-6">
            {mode === "signin" ? (
              <>Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Sign up free
                </button>
              </>
            ) : mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Sign in
                </button>
              </>
            ) : (
              <>Remember it?{" "}
                <button onClick={() => setMode("signin")} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Back to sign in
                </button>
              </>
            )}
          </p>

          <p className="text-center text-[10px] text-white/15 mt-6">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
