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
import { Search, Bell, Settings } from "lucide-react";

export type TabId = "intelligence" | "simulator" | "analytics" | "history" | "cities" | "profile" | "assistant";

const TAB_LABELS: Record<TabId, { label: string; section: string }> = {
  intelligence: { label: "Intelligence Dashboard", section: "Live Risk Events" },
  simulator:    { label: "Profit Simulator",        section: "Scenario Modeling" },
  analytics:    { label: "Analytics",               section: "Monthly Performance" },
  history:      { label: "Decision History",        section: "Audit Timeline" },
  cities:       { label: "City Comparisons",        section: "Regional Monitor" },
  profile:      { label: "Profile",                 section: "Account Settings" },
  assistant:    { label: "AI Assistant",            section: "AURA Intelligence" },
};

export default function Dashboard() {
  const [activeTab,      setActiveTab]      = useState<TabId>("intelligence");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userAvatar,     setUserAvatar]     = useState<string | null>(null);
  const [userName,       setUserName]       = useState<string | null>(null);

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
    <div className="flex h-screen overflow-hidden" style={{ background: "#13131a" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={true} setOpen={() => {}} />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 220 }}>

        {/* Topbar — glass */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 h-14"
          style={{
            background:  "rgba(27,27,35,0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: "rgba(187,202,191,0.45)" }}>ResilientAI</span>
            <span style={{ color: "rgba(187,202,191,0.25)" }}>/</span>
            <span className="font-semibold" style={{ color: "#e4e1ec" }}>{meta.label}</span>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 h-8 rounded-lg text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 200 }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: "rgba(187,202,191,0.35)" }} />
            <span style={{ color: "rgba(187,202,191,0.35)", fontSize: "0.8125rem" }}>Search signals…</span>
          </div>

          {/* Icons + avatar */}
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab("profile")} className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #10b981, #4edea3)" }}
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
          </div>
        </main>
      </div>

      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <VoiceAssistant />
    </div>
  );
}
