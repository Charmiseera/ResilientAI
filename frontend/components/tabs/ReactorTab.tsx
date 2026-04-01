"use client";

import React from "react";
import QuantumReactor from "../QuantumReactor";
import AlgorithmDetails from "../AlgorithmDetails";
import { motion } from "framer-motion";

export const ReactorTab = () => {
  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section with Reactor - Reduced Height for better fit */}
      <section className="relative h-[550px] w-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-12 left-12 z-20 max-w-md pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold tracking-tighter text-zinc-600 dark:text-zinc-400 mb-4">
              Quantum <br />
              <span className="text-red-600 dark:text-red-500/80">Optimization Reactor</span>
            </h1>
            <p className="text-zinc-500 dark:text-gray-400 leading-relaxed font-mono text-sm uppercase tracking-[0.2em]">
              Powering resilience through sub-atomic trade-off analysis.
            </p>
          </motion.div>
        </div>

        {/* 3D Component */}
        <QuantumReactor />

        {/* Floating Stats */}
        <div className="absolute bottom-12 right-12 z-20 flex gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-right"
          >
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Latency</div>
            <div className="text-2xl font-mono text-red-500">0.0042s</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-right"
          >
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Solutions Scanned</div>
            <div className="text-2xl font-mono text-red-500">14.2M</div>
          </motion.div>
        </div>
      </section>

      {/* Deep Dive Content */}
      <AlgorithmDetails />
    </div>
  );
};
