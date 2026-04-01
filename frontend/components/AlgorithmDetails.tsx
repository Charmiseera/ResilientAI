"use client";

import React from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { Zap, Activity, ShieldCheck, BrainCircuit } from "lucide-react";

// Variants defined outside to ensure stable references and fix type resolution
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const AlgorithmDetails = () => {

  const features = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-red-500" />,
      title: "Quantum-Inspired Optimization",
      description: "Uses QAOA to process multi-variable trade-offs in milliseconds.",
      align: "md:text-right"
    },
    {
      icon: <Zap className="w-6 h-6 text-orange-500" />,
      title: "Real-time Decision Flux",
      description: "Reactor pulses as it calculates optimal balance of cost, risk, and stability.",
      align: "md:text-left"
    },
    {
      icon: <Activity className="w-6 h-6 text-pink-500" />,
      title: "Market Correlation Pulse",
      description: "Monitors global commodity shifts and local MSME margins.",
      align: "md:text-right"
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      title: "Resilience Core Sync",
      description: "Mathematically verified recommendations for long-term growth.",
      align: "md:text-left"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 relative z-10 overflow-hidden">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col items-center"
      >
        {/* Header Section - Full Width & Centered */}
        <motion.div variants={item} className="max-w-4xl w-full text-center space-y-6 mb-20">
          <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-600 to-orange-600">
            The Power Behind the Decisions
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            At the heart of ResilientAI lies an advanced Optimization Reactor. Unlike traditional linear models,
            our quantum-inspired algorithms explore millions of potential supply chain combinations simultaneously
            to find the one that maximizes your resilience and profit.
          </p>
        </motion.div>

        {/* Content Grid: Features surrounding centered QAOA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center w-full">

          {/* Left Column Features (1 & 3) */}
          <div className="space-y-16 order-2 md:order-1">
            {features.filter((_, i) => i % 2 === 0).map((feature, idx) => (
              <motion.div key={idx} variants={item} className={`group space-y-4 ${feature.align}`}>
                <div className={`p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all duration-500 md:ml-auto`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{feature.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm md:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Center Column: QAOA Core Animation */}
          <motion.div variants={item} className="relative aspect-square order-1 md:order-2 flex items-center justify-center">
            {/* Spinning Rings using Framer Motion for reliability */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-white/5 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[10%] border border-dashed border-red-500/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[20%] border border-white/10 rounded-full"
              />
              <div className="absolute inset-0 bg-red-500/5 blur-[80px] animate-pulse" />
            </div>

            <div className="relative text-center z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-7xl font-black text-zinc-900/10 dark:text-white/10 tracking-tighter"
              >
                QAOA
              </motion.div>
              <div className="text-[10px] tracking-[0.6em] text-red-500 font-bold uppercase mt-2">
                Neural Core Analysis
              </div>
            </div>
          </motion.div>

          {/* Right Column Features (2 & 4) */}
          <div className="space-y-16 order-3 md:order-3">
            {features.filter((_, i) => i % 2 !== 0).map((feature, idx) => (
              <motion.div key={idx} variants={item} className={`group space-y-4 ${feature.align}`}>
                <div className={`p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all duration-500 md:mr-auto`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{feature.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm md:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default AlgorithmDetails;
