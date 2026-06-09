"use client";

import { motion } from "motion/react";

interface ConnectionStatusProps {
  status: "disconnected" | "connecting" | "connected";
  label: string;
}

const statusColors = {
  disconnected: "bg-zinc-500",
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
};

const statusText = {
  disconnected: "未连接",
  connecting: "连接中",
  connected: "已连接",
};

export function ConnectionStatus({ status, label }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`}
        animate={
          status === "connecting"
            ? { opacity: [1, 0.3, 1] }
            : status === "connected"
            ? { scale: [1, 1.3, 1] }
            : {}
        }
        transition={{
          duration: status === "connecting" ? 1.2 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <span className="text-zinc-500 text-xs">
        {label}
        <span className="text-zinc-600 mx-1">/</span>
        {statusText[status]}
      </span>
    </div>
  );
}
