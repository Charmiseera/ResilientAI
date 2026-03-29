"use client";

import { TabId } from "@/app/page";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  BrainCircuit,
  BarChart3,
  TrendingUp,
  History,
  MapPin,
  User,
  Bot,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
} from "lucide-react";

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "intelligence", label: "Intelligence", icon: BrainCircuit, badge: "LIVE" },
  { id: "simulator", label: "Profit Simulator", icon: TrendingUp },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "Decision History", icon: History },
  { id: "cities", label: "City Comparisons", icon: MapPin },
  { id: "assistant", label: "AI Assistant", icon: Bot, badge: "NEW" },
  { id: "profile", label: "Profile", icon: User },
];

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, open, setOpen }: SidebarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserAvatar(user.user_metadata?.avatar_url ?? null);
      }
    });
  }, []);

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-[#0d0d15] border-r border-white/5 transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-black" />
        </div>
        {open && (
          <div>
            <span className="font-bold text-white text-sm tracking-tight">ResilientAI</span>
            <p className="text-[10px] text-white/40 tracking-widest uppercase">AURA Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white/70"}`} />
              {open && (
                <>
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest ${badge === "LIVE" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {badge}
                    </span>
                  )}
                </>
              )}
              {!open && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      {userEmail && (
        <div className={`px-2 pb-2 border-t border-white/5 pt-2 space-y-1`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] ${
            open ? "" : "justify-center"
          }`}>
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {userEmail[0].toUpperCase()}
              </div>
            )}
            {open && (
              <p className="text-white/40 text-[10px] truncate flex-1">{userEmail}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/5 text-xs transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {open && "Sign Out"}
          </button>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
