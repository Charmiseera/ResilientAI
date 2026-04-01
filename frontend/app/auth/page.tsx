"use client";

import { useState, useEffect, Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

type Mode = "signin" | "signup" | "forgot";

function AuthContent() {
  const searchParams  = useSearchParams();
  const callbackError = searchParams.get("error");

  const [mode,       setMode]       = useState<Mode>("signin");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error,      setError]      = useState(callbackError ? "Authentication failed. Please try again." : "");
  const [success,    setSuccess]    = useState("");

  useEffect(() => { setError(""); setSuccess(""); }, [mode]);

  async function handleGoogle() {
    setGoogleLoad(true); setError("");
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) { setError(error.message); setGoogleLoad(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        });
        if (error) throw error;
        setSuccess("Password reset email sent! Check your inbox.");
        setLoading(false); return;
      }
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("signin"); setLoading(false); return;
      }
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  const heading = {
    signin: { title: "Secure Decision Intelligence", sub: "Log in to your command center." },
    signup: { title: "Create Your Identity",          sub: "Start your intelligence access today." },
    forgot: { title: "Reset Access Cipher",           sub: "We'll send a reset link to your email." },
  }[mode];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--color-rai-obsidian)] text-[var(--color-rai-text)] font-sans"
    >
      {/* Hero ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      {/* System label — top left */}
      <div className="absolute top-5 left-7 text-[10px] tracking-[0.12em] uppercase text-[var(--color-glass-text-dim)]">
        ResilientAI // System Auth v4.0
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 z-10">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-glass-highlight)] border border-[var(--color-rai-acid)]/30"
        >
          {/* Target/radar icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{color: "var(--color-rai-acid)"}} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <span className="font-bold text-[var(--color-rai-text)] text-lg tracking-tight">ResilientAI</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-8 z-10 px-4">
        <h1 className="text-2xl font-bold text-[var(--color-rai-text)] mb-2">{heading.title}</h1>
        <p className="text-sm text-[var(--color-glass-text-dim)]">{heading.sub}</p>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full mx-4 p-8 space-y-5 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] shadow-2xl rounded-[1.25rem] backdrop-blur-[20px]"
        style={{ maxWidth: 380 }}
      >
        {/* Error / Success */}
        {error && (
          <div className="text-sm px-4 py-3 rounded-xl bg-[var(--color-rai-crimson)]/10 border border-[var(--color-rai-crimson)]/20 text-[var(--color-rai-crimson)]">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-[var(--color-glass-highlight)] border border-[var(--color-rai-acid)]/20 text-[var(--color-rai-acid)]">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Google button */}
        {mode !== "forgot" && (
          <>
            <button
              onClick={handleGoogle}
              disabled={googleLoad || loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] text-[var(--color-rai-text)] hover:bg-[var(--color-glass-highlight)] hover:border(--color-rai-acid)]/30"
            >
              {googleLoad ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--color-glass-border)]" />
              <span className="text-[11px] text-[var(--color-glass-text-dim)]/50">or</span>
              <div className="flex-1 h-px bg-[var(--color-glass-border)]" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--color-glass-text-dim)]">
              Command Identity
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-glass-text-dim)]" />
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email Address"
                className="input-obsidian pl-9"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--color-glass-text-dim)]">
                  Access Cipher
                </label>
                {mode === "signin" && (
                  <button type="button" onClick={() => setMode("forgot")}
                          className="text-[10px] font-semibold transition-colors text-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)]/80">
                    FORGOT?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-glass-text-dim)]" />
                <input
                  type={showPass ? "text" : "password"} required minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-obsidian pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-[var(--color-glass-text-dim)] hover:text-[var(--color-rai-text)]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || googleLoad}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 text-sm font-semibold rounded-xl transition-transform hover:-translate-y-0.5 active:scale-95 text-[var(--color-rai-obsidian)]"
            style={{ background: "linear-gradient(135deg, var(--color-rai-acid), var(--color-rai-acid))"}}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === "signin"  ? "Access Intelligence →" :
             mode === "signup"  ? "Create Account →" :
             "Send Reset Email →"}
          </button>
        </form>

        {/* Mode switcher */}
        <p className="text-center text-sm text-[var(--color-glass-text-dim)]">
          {mode === "signin" ? (
            <>Don't have an account?{" "}
              <button onClick={() => setMode("signup")}
                      className="font-semibold transition-colors text-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)]/80">
                Sign up
              </button>
            </>
          ) : mode === "signup" ? (
            <>Already have an account?{" "}
              <button onClick={() => setMode("signin")}
                      className="font-semibold transition-colors text-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)]/80">
                Sign in
              </button>
            </>
          ) : (
            <>Remember it?{" "}
              <button onClick={() => setMode("signin")}
                      className="font-semibold transition-colors text-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)]/80">
                Back to sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Quantum secured badge */}
      <div className="flex items-center gap-6 mt-10 z-10">
        <div className="h-px w-16 bg-[var(--color-glass-border)]" />
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--color-rai-acid)] bg-[var(--color-glass-highlight)] border border-[var(--color-rai-acid)]/20"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Quantum Secured
        </div>
        <div className="h-px w-16 bg-[var(--color-glass-border)]" />
      </div>

      {/* Latency indicator — bottom right */}
      <div className="absolute bottom-5 right-7 text-[10px] tracking-[0.1em] text-[var(--color-glass-text-dim)]/50">
        LATENCY: 12ms // STABLE
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-rai-obsidian)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-rai-acid)]" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
