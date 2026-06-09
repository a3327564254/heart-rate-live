"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PulseRing } from "./PulseRing";

interface HeartRateDisplayProps {
  bpm: number;
  isLive: boolean;
}

export function HeartRateDisplay({ bpm, isLive }: HeartRateDisplayProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center">
      {/* 脉搏圆环 */}
      <PulseRing bpm={bpm} className="w-56 h-56 md:w-72 md:h-72" />

      {/* 心率数字 */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={bpm}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="font-mono text-7xl md:text-8xl font-bold text-white tracking-tighter leading-none"
          >
            {bpm > 0 ? bpm : <span className="text-zinc-600">--</span>}
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="mt-3 text-[11px] tracking-[0.2em] uppercase"
          animate={isLive ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className={isLive ? "text-rose-400" : "text-zinc-600"}>
            {isLive ? "实时" : "离线"}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
