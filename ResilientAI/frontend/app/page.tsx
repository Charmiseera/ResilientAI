"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Sidebar } from "@/components/layout/Sidebar";
import { VoiceAssistant } from "@/components/ui/VoiceAssistant";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { IntelligenceTab } from "@/components/tabs/IntelligenceTab";
import { SimulatorTab } from "@/components/tabs/SimulatorTab";
import { AnalyticsTab } from "@/components/tabs/AnalyticsTab";
import { DecisionHistoryTab } from "@/components/tabs/DecisionHistoryTab";
import { CityComparisonsTab } from "@/components/tabs/CityComparisonsTab";
import { AIAssistantTab } from "@/components/tabs/AIAssistantTab";

export type TabId = "intelligence" | "simulator" | "analytics" | "history" | "cities" | "profile" | "assistant";

export default function Dashboard() {
  const [activeTab,     setActiveTab]     = useState<TabId>("intelligence");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding modal if the user hasn't completed it yet
    const alreadyOnboarded = localStorage.getItem("rai_onboarded") === "true";
    const hasCity          = !!localStorage.getItem("rai_city");

    if (alreadyOnboarded || hasCity) return;

    // Double-check Supabase — only show if logged in
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      if (user) setShowOnboarding(true);
    });
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        <div className="min-h-full p-6 lg:p-8">
          {activeTab === "intelligence" && <IntelligenceTab />}
          {activeTab === "simulator"    && <SimulatorTab />}
          {activeTab === "analytics"    && <AnalyticsTab />}
          {activeTab === "history"      && <DecisionHistoryTab />}
          {activeTab === "cities"       && <CityComparisonsTab />}
          {activeTab === "profile"      && <ProfileTab />}
          {activeTab === "assistant"    && <AIAssistantTab />}
        </div>
      </main>

      {/* Onboarding modal — shown once after first login */}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Global floating voice assistant */}
      <VoiceAssistant />
    </div>
  );
}
