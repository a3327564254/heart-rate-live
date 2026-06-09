"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";

interface HeartRateDisplayProps {
  bpm: number;
  isLive: boolean;
}

export function HeartRateDisplay({ bpm, isLive }: HeartRateDisplayProps) {
  const reduce = useReducedMotion();
  const interval = bpm > 0 ? 60 / bpm : 1.5;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
      {/* 外层光晕 */}
      {isLive && bpm > 0 && !reduce && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, var(--accent-bg) 0%, transparent 60%)`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: interval, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* 脉搏圆环 - 外 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${isLive ? "var(--accent-border)" : "var(--border)"}` }}
        animate={reduce ? {} : { scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: interval, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 脉搏圆环 - 中 */}
      <motion.div
        className="absolute inset-5 rounded-full"
        style={{ border: `1px solid ${isLive ? "var(--accent-border)" : "var(--border)"}` }}
        animate={reduce ? {} : { scale: [1, 1.04, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: interval, repeat: Infinity, ease: "easeInOut", delay: interval * 0.08 }}
      />

      {/* 内层背景 */}
      <div
        className="absolute inset-10 rounded-full"
        style={{
          background: isLive
            ? `radial-gradient(circle, var(--accent-bg) 0%, var(--bg-primary) 100%)`
            : `radial-gradient(circle, var(--bg-tertiary) 0%, var(--bg-primary) 100%)`,
        }}
      />

      {/* 心率数字 */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={bpm}
            initial={reduce ? false : { opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.1 }}
            className="font-mono font-bold tracking-tighter leading-none"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 5rem)",
              color: isLive ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            {bpm > 0 ? bpm : "--"}
          </motion.div>
        </AnimatePresence>

        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {isLive && bpm > 0 && (
            <motion.div
              className="w-1 h-1 rounded-full"
              style={{ background: "var(--accent)" }}
              animate={reduce ? {} : { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: interval, repeat: Infinity }}
            />
          )}
          <span
            className="text-[10px] tracking-[0.15em] font-mono"
            style={{ color: isLive ? "var(--accent)" : "var(--text-tertiary)" }}
          >
            {isLive ? "实时" : "离线"}
          </span>
        </div>
      </div>
    </div>
  );
}
