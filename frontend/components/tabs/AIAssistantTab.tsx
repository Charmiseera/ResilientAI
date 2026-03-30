"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, User, Loader2, Zap } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER: Message[] = [
  {
    id: "init",
    role: "assistant",
    content: "Hello! I'm AURA, powered by Kimi-K2.5. I can help you analyse supply chain risks, optimise pricing, and interpret your dashboard data. What would you like to know?",
  },
];

const QUICK_PROMPTS = [
  "What are the biggest risks right now?",
  "How should I adjust prices for Hormuz disruption?",
  "Which Indian city has the best margins?",
  "Explain the quantum optimizer decision",
];

export function AIAssistantTab() {
  const [messages, setMessages]     = useState<Message[]>(STARTER);
  const [history, setHistory]       = useState<{ role: string; content: string }[]>([]); // tracks full convo for Kimi
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  function toggleListen() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  function speak(text: string) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    window.speechSynthesis.speak(utt);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    // Build history for Kimi (without the initial greeting)
    const newHistory = [...history, { role: "user", content }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed");

      const reply = data.reply as string;
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (err: any) {
      setError(err.message || "Failed to connect to AURA");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AURA Intelligence</h1>
            <p className="text-white/30 text-xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              Powered by Kimi-K2.5-fast · Nebius AI
            </p>
          </div>
        </div>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            voiceEnabled
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white"
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {voiceEnabled ? "Voice On" : "Voice Off"}
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
              msg.role === "assistant"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/10 text-white"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-white rounded-tr-sm"
                  : "bg-white/[0.04] border border-white/5 text-white/85 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="text-white/40 text-xs">AURA is thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 flex gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-2">
        <button
          onClick={toggleListen}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? "bg-red-500/20 text-red-400 animate-pulse"
              : "text-white/30 hover:text-white hover:bg-white/5"
          }`}
          title="Voice input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={isListening ? "Listening…" : "Ask about risks, pricing, cities, strategies…"}
          className="flex-1 bg-transparent outline-none text-white placeholder-white/20 text-sm"
          disabled={loading}
        />

        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
