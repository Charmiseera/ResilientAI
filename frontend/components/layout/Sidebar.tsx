"use client";

import { TabId } from "@/app/page";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  TrendingUp, BarChart3, History, MapPin, User, Bot, LogOut,
  Zap, Activity,
} from "lucide-react";

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "intelligence", label: "Intelligence",     icon: Activity },
  { id: "simulator",   label: "Simulator",         icon: TrendingUp },
  { id: "analytics",   label: "Analytics",         icon: BarChart3 },
  { id: "history",     label: "History",           icon: History },
  { id: "cities",      label: "Cities",            icon: MapPin },
  { id: "assistant",   label: "AI Assistant",      icon: Bot },
];

const BOTTOM_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
];

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [userName,  setUserName]    = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserAvatar(user.user_metadata?.avatar_url ?? null);
        // Try localStorage name first, then metadata
        const storedName = localStorage.getItem("rai_name");
        setUserName(storedName || user.user_metadata?.full_name || user.email?.split("@")[0] || null);
      }
    });
  }, []);

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/auth";
  }

  function NavItem({ id, label, icon: Icon }: { id: TabId; label: string; icon: React.ElementType }) {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 relative group"
        style={{
          color:      isActive ? "#4edea3"    : "rgba(187,202,191,0.6)",
          background: isActive ? "rgba(78,222,163,0.06)" : "transparent",
          borderLeft: isActive ? "2px solid #4edea3" : "2px solid transparent",
        }}
      >
        <Icon
          className="w-[18px] h-[18px] flex-shrink-0 transition-colors"
          style={{ color: isActive ? "#4edea3" : "rgba(187,202,191,0.45)" }}
        />
        <span style={{ color: isActive ? "#e4e1ec" : "rgba(187,202,191,0.6)" }}>{label}</span>
      </button>
    );
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full z-40 flex flex-col"
      style={{ width: 220, background: "#1b1b23" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-0.5">
          {/* Hexagon icon */}
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "rgba(78,222,163,0.15)", border: "1px solid rgba(78,222,163,0.3)" }}
          >
            <Zap className="w-4 h-4" style={{ color: "#4edea3" }} />
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight">ResilientAI</span>
        </div>
        <p className="text-[9px] font-medium tracking-[0.12em] uppercase ml-[42px]"
           style={{ color: "rgba(187,202,191,0.35)" }}>
          Editorial Intelligence
        </p>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 20px 12px" }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        {NAV_ITEMS.map(item => <NavItem key={item.id} {...item} />)}
      </nav>

      {/* Bottom section */}
      <div>
        {/* Separator */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

        {BOTTOM_ITEMS.map(item => <NavItem key={item.id} {...item} />)}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all group"
          style={{ color: "rgba(187,202,191,0.45)", borderLeft: "2px solid transparent" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ffb3af")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(187,202,191,0.45)")}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Logout</span>
        </button>

        {/* Separator */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

        {/* User chip */}
        {userEmail && (
          <div className="px-4 py-4 flex items-center gap-3">
            {userAvatar ? (
              <img src={userAvatar} alt="avatar"
                className="w-8 h-8 rounded-full flex-shrink-0 ring-2"
                style={{ boxShadow: "0 0 0 2px rgba(78,222,163,0.3)" }} />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #10b981, #4edea3)" }}
              >
                {(userName || userEmail)[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userName || userEmail?.split("@")[0]}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(187,202,191,0.4)" }}>
                Operations Lead
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
