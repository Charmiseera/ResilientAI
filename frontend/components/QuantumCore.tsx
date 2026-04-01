"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface QuantumCoreProps {
  className?: string;
}

export const QuantumCore: React.FC<QuantumCoreProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Sketchfab Embed URL with 'Clean' parameters
  const sketchfabUrl = "https://sketchfab.com/models/4df59a9d36f94f69ad2299ef6e6a9c63/embed" + 
    "?autostart=1" + 
    "&internal=1" + 
    "&ui_infos=0" + 
    "&ui_controls=0" + 
    "&ui_watermark=0" + 
    "&ui_hint=0" + 
    "&transparent=1" + 
    "&scrollwheel=1" + 
    "&double_click=1" + 
    "&ui_theme=dark" +
    "&dpr=2";

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
          <p className="text-red-500/60 text-xs font-mono tracking-widest uppercase animate-pulse">
            Initializing Neural Core...
          </p>
        </div>
      )}

      {/* 
        Aggressive Frameless Wrapper:
        - We zoom the iframe to push the branding/controls outside the viewport.
        - We use a tight clipPath to ensure any leftover UI is invisible.
      */}
      <div className="relative w-full h-full overflow-hidden">
        <iframe
          title="Detonated Core"
          src={sketchfabUrl}
          onLoad={() => setIsLoading(false)}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          className="absolute border-0 pointer-events-auto"
          style={{
            top: "-15%", // Aggressively push up to hide "by Xplico"
            left: "-5%",
            width: "110%",
            height: "135%", // Aggressively push down to hide animation bar
            transform: "scale(1.1)", // Slight zoom to push edges out
            clipPath: "inset(12% 0% 12% 0%)", // Top and Bottom crops
            zIndex: 0
          }}
        />
      </div>

      {/* Decorative Overlay to blend with the ResilientAI UI */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--color-rai-obsidian)] via-transparent to-transparent opacity-40" />
      <div className="absolute inset-0 pointer-events-none ring-1 ring-white/5 rounded-3xl" />
    </div>
  );
};

export default QuantumCore;
