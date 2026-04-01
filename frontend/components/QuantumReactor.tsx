"use client";

import React from "react";
import QuantumCore from "./QuantumCore";

const QuantumReactor = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* 
        The 3D Core:
        - We use our specialized QuantumCore which handles the 
        - frameless Sketchfab embed logic.
      */}
      <div className="w-full h-full flex items-center justify-center">
        <QuantumCore className="max-w-[1200px] max-h-[800px]" />
      </div>

      {/* 
        HUD Elements:
        - Overlay elements to enhance the "Reactor" feel.
      */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Glow behind the core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-red-500/10 blur-[120px] rounded-full animate-pulse opacity-40" />
        
        {/* Corner Brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-red-500/30" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-red-500/30" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-red-500/30" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-red-500/30" />

        {/* Reactor Status HUD */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            <span className="text-[10px] text-red-400 font-mono tracking-widest uppercase">
              Core Status: Optimized // Heat: Stable
            </span>
          </div>
        </div>

        {/* Scanning lines effect overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(transparent 50%, #ff4444 50%)",
            backgroundSize: "100% 4px"
          }}
        />
      </div>
    </div>
  );
};

export default QuantumReactor;
