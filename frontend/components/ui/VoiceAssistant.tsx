"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Loader2, Volume2, VolumeX, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type State = "idle" | "listening" | "thinking" | "speaking" | "answer" | "error";

interface Message {
  query: string;
  reply: string;
  lang: string;
}

// ── Web Speech API shim ────────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function VoiceAssistant() {
  const [state,    setState]    = useState<State>("idle");
  const [open,     setOpen]     = useState(false);
  const [message,  setMessage]  = useState<Message | null>(null);
  const [heard,    setHeard]    = useState("");
  const [errorMsg, setError]    = useState("");
  const [history,  setHistory]  = useState<Message[]>([]);
  const [lang,     setLang]     = useState<"en" | "hi">("en");
  const [muted,    setMuted]    = useState(false);

  const recogRef   = useRef<any>(null);
  const synthRef   = useRef<SpeechSynthesisUtterance | null>(null);
  const finalText  = useRef("");

  // Detect stored language preference
  useEffect(() => {
    const stored = localStorage.getItem("rai_lang") as "en" | "hi" | null;
    if (stored) setLang(stored);
  }, []);

  // Cancel speech when unmounted
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // ── Browser TTS (Web Speech Synthesis) ────────────────────────────────────
  const speak = useCallback((text: string, l: string) => {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = l === "hi" ? "hi-IN" : "en-IN";
    utter.rate  = 0.95;
    utter.pitch = 1.05;

    // Pick a good voice if available
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v =>
      v.lang.startsWith(l === "hi" ? "hi" : "en") && v.localService
    ) || voices.find(v => v.lang.startsWith(l === "hi" ? "hi" : "en"));
    if (match) utter.voice = match;

    utter.onstart = () => setState("speaking");
    utter.onend   = () => setState("answer");
    utter.onerror = () => setState("answer");

    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [muted]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState("answer");
  }, []);

  // ── Ask the internal Next.js API route ────────────────────────────────────
  const askAI = useCallback(async (query: string) => {
    setState("thinking");
    setHeard("");
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, lang }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply      = data.text_response ?? "Sorry, no response.";
      const replyLang  = data.detected_lang ?? lang;

      const msg: Message = { query, reply, lang: replyLang };
      setMessage(msg);
      setHistory(h => [msg, ...h.slice(0, 4)]);
      setState("answer");

      // Auto-speak the reply
      if (!muted) {
        // Small delay so browser voices are ready
        setTimeout(() => speak(reply, replyLang), 150);
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
      setState("error");
    }
  }, [lang, muted, speak]);

  // ── Web Speech Recognition ─────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported. Please use Chrome or Edge.");
      setState("error");
      return;
    }

    window.speechSynthesis?.cancel();     // stop any ongoing speech
    finalText.current = "";

    const recog  = new SR();
    recogRef.current = recog;
    recog.lang            = lang === "hi" ? "hi-IN" : "en-IN";
    recog.interimResults  = true;
    recog.maxAlternatives = 1;
    recog.continuous      = false;

    recog.onstart  = () => { setState("listening"); setHeard(""); };

    recog.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      setHeard(transcript);
      finalText.current = transcript;
    };

    recog.onend = () => {
      const text = finalText.current.trim();
      if (text) {
        askAI(text);
      } else {
        setState("idle");
      }
    };

    recog.onerror = (e: any) => {
      if (e.error === "no-speech") { setState("idle"); return; }
      setError(`Mic error: ${e.error}`);
      setState("error");
    };

    recog.start();
  }, [lang, askAI]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setState("idle");
  }, []);

  // ── FAB click ──────────────────────────────────────────────────────────────
  function handleFabClick() {
    if (!open) { setOpen(true); return; }

    if (state === "speaking") { stopSpeaking(); return; }
    if (state === "listening") { stopListening(); return; }
    if (state === "idle" || state === "answer" || state === "error") {
      startListening();
    }
  }

  // ── FAB gradient per state ─────────────────────────────────────────────────
  const fabGrad: Record<State, string> = {
    idle:     "from-emerald-500 to-teal-600",
    listening:"from-red-500 to-rose-600",
    thinking: "from-zinc-800 to-zinc-900",
    speaking: "from-emerald-400 to-teal-500",
    answer:   "from-emerald-500 to-teal-600",
    error:    "from-orange-500 to-amber-600",
  };

  const stateLabel: Record<State, string> = {
    idle:      lang === "hi" ? "बोलें" : "Speak",
    listening: lang === "hi" ? "रोकें" : "Stop",
    thinking:  lang === "hi" ? "सोच रहा है…" : "Thinking…",
    speaking:  lang === "hi" ? "रोकें" : "Stop speaking",
    answer:    lang === "hi" ? "फिर पूछें" : "Ask again",
    error:     lang === "hi" ? "दोबारा कोशिश" : "Retry",
  };

  return (
    <>
      {/* ── Floating Popup Panel ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 w-84 z-50 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0d0d12]/96 backdrop-blur-2xl shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
          style={{ width: "22rem" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                state === "listening" ? "bg-red-400 animate-pulse" :
                state === "thinking"  ? "bg-violet-400 animate-pulse" :
                state === "speaking"  ? "bg-emerald-400 animate-pulse" :
                state === "answer"    ? "bg-emerald-400" :
                "bg-emerald-400/60"
              }`} />
              <span className="text-slate-900 dark:text-slate-50 text-sm font-semibold tracking-tight">🎤 ResilientAI Voice</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Mute toggle */}
              <button
                onClick={() => { setMuted(m => !m); window.speechSynthesis?.cancel(); }}
                title={muted ? "Unmute voice" : "Mute voice"}
                className="p-1.5 rounded-lg text-slate-400 dark:text-rai-text/30 hover:text-slate-900 dark:hover:text-rai-text hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              {/* Lang toggle */}
              <button
                onClick={() => setLang(l => l === "en" ? "hi" : "en")}
                className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-rai-text/50 hover:text-slate-900 dark:hover:text-rai-text transition-all"
              >
                {lang === "en" ? "EN" : "हि"}
              </button>
              <button
                onClick={() => { setOpen(false); stopListening(); stopSpeaking(); }}
                className="p-1.5 rounded-lg text-slate-400 dark:text-rai-text/25 hover:text-slate-900 dark:hover:text-rai-text hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-4 space-y-3 min-h-[140px] max-h-72 overflow-y-auto">

            {/* Idle / Ready state */}
            {state === "idle" && !message && (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🎙️</div>
                <p className="text-slate-600 dark:text-rai-text/50 text-sm font-medium">
                  {lang === "hi" ? "माइक बटन दबाएं और बोलें" : "Press mic and speak your question"}
                </p>
                <p className="text-slate-400 dark:text-rai-text/20 text-[11px] mt-1.5">
                  {lang === "hi"
                    ? "LPG, गेहूं, डीजल कीमतों के बारे में पूछें"
                    : "Ask about LPG, wheat, diesel, freight prices…"}
                </p>
              </div>
            )}

            {/* Listening */}
            {state === "listening" && (
              <div className="text-center py-5">
                <div className="flex justify-center items-end gap-1 mb-3 h-10">
                  {[3, 5, 8, 6, 4, 9, 5, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-red-400 rounded-full animate-bounce"
                      style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
                <p className="text-red-300 text-sm font-semibold">🔴 {lang === "hi" ? "सुन रहा हूँ…" : "Listening…"}</p>
                {heard && (
                  <p className="text-slate-500 dark:text-rai-text/50 text-xs mt-2 italic px-2">"{heard}"</p>
                )}
              </div>
            )}

            {/* Thinking */}
            {state === "thinking" && (
              <div className="text-center py-6 space-y-3">
                <div className="relative inline-flex">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
                </div>
                <p className="text-violet-300 text-sm font-medium">
                  {lang === "hi" ? "🧠 AI सोच रहा है…" : "🧠 AI is thinking…"}
                </p>
              </div>
            )}

            {/* Speaking */}
            {state === "speaking" && (
              <div className="text-center py-4 space-y-2">
                <div className="flex justify-center items-center gap-1">
                  {[4,7,10,7,4].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-emerald-400 rounded-full"
                      style={{
                        height: `${h * 3}px`,
                        animation: `bounce ${0.5 + i * 0.1}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-emerald-300 text-sm font-semibold">
                  🔊 {lang === "hi" ? "बोल रहा हूँ…" : "Speaking…"}
                </p>
              </div>
            )}

            {/* Error */}
            {state === "error" && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-orange-600 dark:text-orange-300 text-xs text-center space-y-2">
                <p>⚠️ {errorMsg}</p>
                <button
                  onClick={() => setState("idle")}
                  className="text-slate-400 dark:text-rai-text/50 hover:text-slate-900 dark:hover:text-rai-text underline text-[10px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Answer + Chat bubble */}
            {message && (state === "answer" || state === "speaking" || state === "idle") && (
              <div className="space-y-2">
                {/* User query */}
                <div className="flex justify-end">
                  <div className="bg-red-500/15 border border-red-500/20 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[88%]">
                    <p className="text-red-200 text-xs leading-relaxed">{message.query}</p>
                  </div>
                </div>
                {/* AI reply */}
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                  <div className="bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[88%] shadow-sm dark:shadow-none">
                    <p className="text-slate-800 dark:text-rai-text/85 text-xs leading-relaxed">{message.reply}</p>
                    {/* Replay / mute controls */}
                    <div className="flex items-center gap-2 mt-2">
                      {!muted && (
                        <button
                          onClick={() => speak(message.reply, message.lang)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-rai-text/25 hover:text-red-500 transition-colors"
                        >
                          <Volume2 className="w-3 h-3" />
                          {lang === "hi" ? "दोबारा सुनें" : "Replay"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 1 && (
              <details className="group">
                <summary className="text-[10px] text-slate-400 dark:text-rai-text/20 cursor-pointer hover:text-slate-900 dark:hover:text-rai-text/40 flex items-center gap-1 list-none mt-1">
                  <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                  {history.length - 1} prev question{history.length > 2 ? "s" : ""}
                </summary>
                <div className="mt-2 space-y-2 border-t border-slate-100 dark:border-white/5 pt-2">
                  {history.slice(1).map((h, i) => (
                    <div key={i} className="text-[10px] space-y-0.5">
                      <p className="text-red-400/60 dark:text-red-400/40 font-medium">Q: {h.query}</p>
                      <p className="text-slate-400 dark:text-rai-text/20 line-clamp-2">{h.reply}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* ── Bottom action bar ── */}
          <div className="border-t border-slate-200 dark:border-white/[0.07] px-4 py-3 flex items-center gap-2 bg-slate-50/50 dark:bg-white/[0.01]">
            <button
              onClick={handleFabClick}
              disabled={state === "thinking"}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                state === "listening"
                  ? "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                  : state === "speaking"
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                  : state === "thinking"
                  ? "bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 cursor-wait"
                  : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-rai-text/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-rai-text"
              }`}
            >
              {state === "thinking" ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{stateLabel.thinking}</>
              ) : state === "listening" ? (
                <><MicOff className="w-4 h-4" />{stateLabel.listening}</>
              ) : (
                <><Mic className={`w-4 h-4 ${state === "speaking" ? "text-emerald-400" : "text-red-400"}`} />
                  {stateLabel[state]}</>
              )}
            </button>
            {(state === "answer" || state === "error") && (
              <button
                onClick={() => { setMessage(null); setState("idle"); setHeard(""); }}
                className="px-3 py-2.5 rounded-xl text-[11px] text-slate-400 dark:text-rai-text/30 hover:text-slate-900 dark:hover:text-rai-text bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-all"
              >
                {lang === "hi" ? "नया" : "Clear"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Action Button ── */}
      <button
        onClick={handleFabClick}
        title="Voice Assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-[var(--color-rai-text)]
          bg-gradient-to-br ${fabGrad[state]}
          transition-all duration-300 active:scale-95 hover:scale-105`}
        style={{
          boxShadow: state === "listening"
            ? "0 0 0 4px rgba(239,68,68,0.25), 0 8px 32px rgba(239,68,68,0.5)"
            : state === "speaking"
            ? "0 0 0 4px rgba(16,185,129,0.2), 0 8px 32px rgba(16,185,129,0.4)"
            : "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        {/* Mic icon */}
        {state === "thinking" ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : state === "listening" || state === "speaking" ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}

        {/* Pulse ring when listening */}
        {state === "listening" && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: "1s" }} />
            <span className="absolute inset-[-8px] rounded-full border border-red-400/20 animate-pulse" />
          </>
        )}

        {/* Speaking ripple */}
        {state === "speaking" && (
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: "1.5s" }} />
        )}

        {/* Unread badge when panel is closed and answer is ready */}
        {!open && message && (state === "answer" || state === "speaking") && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f] flex items-center justify-center text-[7px] font-bold animate-pulse">
            ●
          </span>
        )}
      </button>
    </>
  );
}
