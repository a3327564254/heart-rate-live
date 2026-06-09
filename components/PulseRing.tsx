"use client";

import { motion, useReducedMotion } from "motion/react";

interface PulseRingProps {
  bpm: number;
  className?: string;
}

export function PulseRing({ bpm, className = "" }: PulseRingProps) {
  const reduce = useReducedMotion();
  const interval = bpm > 0 ? 60 / bpm : 1.5;

  return (
    <div className={`relative ${className}`}>
      {/* 外圈 */}
      <motion.div
        className="absolute inset-0 rounded-full border border-rose-500/20"
        animate={
          reduce
            ? {}
            : {
                scale: [1, 1.12, 1],
                opacity: [0.2, 0.5, 0.2],
              }
        }
        transition={{
          duration: interval,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* 中圈 */}
      <motion.div
        className="absolute inset-3 rounded-full border border-rose-500/15"
        animate={
          reduce
            ? {}
            : {
                scale: [1, 1.08, 1],
                opacity: [0.15, 0.35, 0.15],
              }
        }
        transition={{
          duration: interval,
          repeat: Infinity,
          ease: "easeInOut",
          delay: interval * 0.12,
        }}
      />
      {/* 内圈发光 */}
      <motion.div
        className="absolute inset-6 rounded-full bg-rose-500/5"
        animate={
          reduce
            ? {}
            : {
                opacity: [0.05, 0.15, 0.05],
              }
        }
        transition={{
          duration: interval,
          repeat: Infinity,
          ease: "easeInOut",
          delay: interval * 0.2,
        }}
      />
    </div>
  );
}
