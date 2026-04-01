"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Shield, BrainCircuit, ActivitySquare, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { Suspense, useEffect, useState } from "react";
import { useTheme } from "next-themes";

const TABS = [
  { id: "profile", label: "My Profile", icon: Shield },
  { id: "intelligence", label: "Intelligence", icon: BrainCircuit },
  { id: "simulator", label: "Simulator", icon: ActivitySquare },
];

function TopNavigationInner() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "profile";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b border-[var(--color-rai-gray)] sticky top-0 bg-[var(--color-rai-obsidian)] z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center overflow-x-auto gap-8 sm:gap-12 md:gap-16 scrollbar-none whitespace-nowrap">
          <div className="flex-shrink-0 flex items-center gap-3 mr-auto">
            {/* Brutalist Logo Block */}
            <div className="h-8 w-8 bg-[var(--color-rai-acid)] border border-[var(--color-rai-text)] shadow-[2px_2px_0px_var(--color-rai-text)]" />
            <span className="font-display font-bold text-2xl tracking-tighter text-[var(--color-rai-text)]">AURA<span className="text-[var(--color-rai-acid)]">.</span></span>
          </div>
          
          <div className="flex space-x-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <Link
                  key={tab.id}
                  href={`/?tab=${tab.id}`}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 font-display text-xs font-bold uppercase tracking-widest border transition-all outline-none",
                    isActive 
                      ? "bg-[var(--color-rai-text)] text-[var(--color-rai-obsidian)] border-[var(--color-rai-text)] shadow-[var(--shadow-soft)] -translate-y-1" 
                      : "bg-[var(--color-rai-obsidian)] text-[var(--color-rai-dim)] border-[var(--color-rai-gray)] hover:border-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)]"
                  )}
                >
                  <Icon className="w-4 h-4 sm:hidden md:block" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center px-4 py-3 border transition-all outline-none bg-[var(--color-rai-obsidian)] text-[var(--color-rai-dim)] border-[var(--color-rai-gray)] hover:border-[var(--color-rai-acid)] hover:text-[var(--color-rai-acid)] hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function TopNavigation() {
    return (
        <Suspense fallback={<div className="h-20 border-b border-[var(--color-rai-gray)] bg-[var(--color-rai-obsidian)]" />}>
            <TopNavigationInner />
        </Suspense>
    )
}
