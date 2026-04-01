"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { IntelligenceTab } from "@/components/tabs/IntelligenceTab";
import { SimulatorTab } from "@/components/tabs/SimulatorTab";
import { AnalyticsTab } from "@/components/tabs/AnalyticsTab";
import { DecisionHistoryTab } from "@/components/tabs/DecisionHistoryTab";
import { CityComparisonsTab } from "@/components/tabs/CityComparisonsTab";
import { AIAssistantTab } from "@/components/tabs/AIAssistantTab";
import { VoiceAssistant } from "@/components/ui/VoiceAssistant";
import { ReactorTab } from "@/components/tabs/ReactorTab";
import { Search, Bell, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export type TabId = "intelligence" | "simulator" | "analytics" | "history" | "cities" | "profile" | "assistant" | "reactor";

const TAB_LABELS: Record<TabId, { label: string; section: string }> = {
  intelligence: { label: "Intelligence Dashboard", section: "Live Risk Events" },
  simulator:    { label: "Profit Simulator",        section: "Scenario Modeling" },
  analytics:    { label: "Analytics",               section: "Monthly Performance" },
  history:      { label: "Decision History",        section: "Audit Timeline" },
  cities:       { label: "City Comparisons",        section: "Regional Monitor" },
  profile:      { label: "Profile",                 section: "Account Settings" },
  assistant:    { label: "AI Assistant",            section: "AURA Intelligence" },
  reactor:      { label: "Quantum Reactor",         section: "Core Engine" },
};

export default function Dashboard() {
  const [activeTab,      setActiveTab]      = useState<TabId>("intelligence");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userAvatar,     setUserAvatar]     = useState<string | null>(null);
  const [userName,       setUserName]       = useState<string | null>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const already = localStorage.getItem("rai_onboarded") === "true";
    const hasCity  = !!localStorage.getItem("rai_city");
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserAvatar(user.user_metadata?.avatar_url ?? null);
        setUserName(localStorage.getItem("rai_name") || user.user_metadata?.full_name || user.email?.split("@")[0] || null);
        if (!already && !hasCity) setShowOnboarding(true);
      }
    });
  }, []);

  const meta = TAB_LABELS[activeTab];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-rai-obsidian)] text-[var(--color-rai-text)]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={true} setOpen={() => {}} />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 220 }}>

        {/* Topbar — glass */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 h-14 bg-[var(--color-glass-bg)] border-b border-[var(--color-glass-border)] backdrop-blur-[12px]"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-glass-text-dim)]">ResilientAI</span>
            <span className="text-[var(--color-glass-text-dim)]/50">/</span>
            <span className="font-semibold text-[var(--color-rai-text)]">{meta.label}</span>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 h-8 rounded-lg text-sm bg-[var(--color-glass-highlight)] border border-[var(--color-glass-border)]"
            style={{ minWidth: 200 }}
          >
            <Search className="w-3.5 h-3.5 text-[var(--color-glass-text-dim)]" />
            <span className="text-[var(--color-glass-text-dim)] text-[0.8125rem]">Search signals…</span>
          </div>

          {/* Icons + avatar */}
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center w-8 h-8 rounded-full border bg-[var(--color-glass-bg)] text-[var(--color-glass-text-dim)] border-[var(--color-glass-border)] hover:border-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)] transition-all outline-none"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button onClick={() => setActiveTab("profile")} className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-rai-obsidian)] text-xs font-bold"
                style={{ background: "linear-gradient(135deg, var(--color-rai-acid), var(--color-rai-acid))" }}
              >
                {userName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto w-full">
            {activeTab === "intelligence" && <IntelligenceTab />}
            {activeTab === "simulator"    && <SimulatorTab />}
            {activeTab === "analytics"    && <AnalyticsTab />}
            {activeTab === "history"      && <DecisionHistoryTab />}
            {activeTab === "cities"       && <CityComparisonsTab />}
            {activeTab === "profile"      && <ProfileTab />}
            {activeTab === "assistant"    && <AIAssistantTab />}
            {activeTab === "reactor"      && <ReactorTab />}
          </div>
        </main>
      </div>

      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <VoiceAssistant />
    </div>
  );
}
