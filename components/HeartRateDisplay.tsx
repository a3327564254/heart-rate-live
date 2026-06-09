"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";

interface HeartRateDisplayProps {
  bpm: number;
  isLive: boolean;
}

/**
 * 心率显示组件
 * 动效目的：脉搏圆环通过缩放+透明度模拟真实心跳节奏，数字跳动反馈数据更新
 */
export function HeartRateDisplay({ bpm, isLive }: HeartRateDisplayProps) {
  const reduce = useReducedMotion();
  const interval = bpm > 0 ? 60 / bpm : 1.5;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
      {/* 外层光晕 - 仅在有数据时显示 */}
      {isLive && bpm > 0 && !reduce && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: interval, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* 脉搏圆环 - 外 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${isLive ? "rgba(244,63,94,0.25)" : "rgba(63,63,70,0.2)"}` }}
        animate={reduce ? {} : { scale: [1, 1.06, 1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: interval, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 脉搏圆环 - 中 */}
      <motion.div
        className="absolute inset-5 rounded-full"
        style={{ border: `1px solid ${isLive ? "rgba(244,63,94,0.15)" : "rgba(63,63,70,0.15)"}` }}
        animate={reduce ? {} : { scale: [1, 1.04, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: interval, repeat: Infinity, ease: "easeInOut", delay: interval * 0.08 }}
      />

      {/* 内层背景 */}
      <div
        className="absolute inset-10 rounded-full"
        style={{
          background: isLive
            ? "radial-gradient(circle, rgba(244,63,94,0.06) 0%, rgba(9,9,11,0.8) 100%)"
            : "radial-gradient(circle, rgba(63,63,70,0.08) 0%, rgba(9,9,11,0.8) 100%)",
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
              color: isLive ? "#fafafa" : "#3f3f46",
            }}
          >
            {bpm > 0 ? bpm : "--"}
          </motion.div>
        </AnimatePresence>

        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {isLive && bpm > 0 && (
            <motion.div
              className="w-1 h-1 rounded-full bg-rose-500"
              animate={reduce ? {} : { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: interval, repeat: Infinity }}
            />
          )}
          <span
            className="text-[10px] tracking-[0.2em] font-mono"
            style={{ color: isLive ? "rgba(244,63,94,0.7)" : "#3f3f46" }}
          >
            {isLive ? "BPM" : "OFFLINE"}
          </span>
        </div>
      </div>
    </div>
  );
}
