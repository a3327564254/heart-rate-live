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
    <div className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72">
      {/* 外层光晕 */}
      {isLive && bpm > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)",
          }}
          animate={reduce ? {} : {
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: interval,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* 脉搏圆环 - 外 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${isLive ? "rgba(244,63,94,0.3)" : "rgba(63,63,70,0.3)"}`,
        }}
        animate={reduce ? {} : {
          scale: [1, 1.08, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: interval,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 脉搏圆环 - 中 */}
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{
          border: `1px solid ${isLive ? "rgba(244,63,94,0.2)" : "rgba(63,63,70,0.2)"}`,
        }}
        animate={reduce ? {} : {
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: interval,
          repeat: Infinity,
          ease: "easeInOut",
          delay: interval * 0.1,
        }}
      />

      {/* 内层背景 */}
      <div
        className="absolute inset-8 rounded-full"
        style={{
          background: isLive
            ? "radial-gradient(circle, rgba(244,63,94,0.08) 0%, rgba(9,9,11,0.5) 100%)"
            : "radial-gradient(circle, rgba(63,63,70,0.1) 0%, rgba(9,9,11,0.5) 100%)",
        }}
      />

      {/* 心率数字 */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={bpm}
            initial={reduce ? false : { opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="font-mono font-bold tracking-tighter leading-none"
            style={{
              fontSize: "clamp(4rem, 12vw, 6rem)",
              color: isLive ? "#fff" : "#52525b",
            }}
          >
            {bpm > 0 ? bpm : "--"}
          </motion.div>
        </AnimatePresence>

        <div className="mt-3 flex items-center justify-center gap-2">
          {isLive && bpm > 0 && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-rose-500"
              animate={reduce ? {} : { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: interval, repeat: Infinity }}
            />
          )}
          <span
            className="text-[10px] tracking-[0.25em] uppercase font-medium"
            style={{ color: isLive ? "rgba(244,63,94,0.8)" : "#52525b" }}
          >
            {isLive ? "BPM" : "离线"}
          </span>
        </div>
      </div>
    </div>
  );
}
