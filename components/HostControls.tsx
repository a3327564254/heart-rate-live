"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Users, Link, Copy, Check } from "@phosphor-icons/react";
import { ConnectionStatus } from "./ConnectionStatus";

interface HostControlsProps {
  bleStatus: "disconnected" | "connecting" | "connected";
  wsStatus: "disconnected" | "connecting" | "connected";
  viewerCount: number;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function HostControls({
  bleStatus,
  wsStatus,
  viewerCount,
  onConnect,
  onDisconnect,
}: HostControlsProps) {
  const [copied, setCopied] = useState(false);
  const isConnected = bleStatus === "connected" && wsStatus === "connected";

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm space-y-3">
      {/* 连接状态 */}
      <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 space-y-2">
        <ConnectionStatus status={bleStatus} label="手环" />
        <ConnectionStatus status={wsStatus} label="服务器" />
        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/50">
          <Users size={13} className="text-zinc-500" weight="light" />
          <span className="text-zinc-500 text-xs">
            {viewerCount} 人观看
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      {!isConnected ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onConnect}
          disabled={bleStatus === "connecting" || wsStatus === "connecting"}
          className="w-full py-4 px-6 rounded-2xl bg-rose-500 text-white font-medium text-sm
                     active:bg-rose-600
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          {bleStatus === "connecting" || wsStatus === "connecting"
            ? "连接中..."
            : "连接手环"}
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDisconnect}
          className="w-full py-4 px-6 rounded-2xl bg-zinc-800 text-zinc-300 font-medium text-sm
                     active:bg-zinc-700
                     transition-colors duration-150"
        >
          断开连接
        </motion.button>
      )}

      {/* 分享链接 */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/50"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Link size={11} className="text-zinc-500" weight="light" />
            <p className="text-[11px] text-zinc-500">分享给观众</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] text-emerald-400 bg-zinc-950/80 px-3 py-2.5 rounded-xl overflow-x-auto font-mono truncate">
              {typeof window !== "undefined" ? window.location.origin : ""}
            </code>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 active:text-white
                         active:bg-zinc-700 transition-colors duration-150"
              aria-label="复制链接"
            >
              {copied ? (
                <Check size={15} weight="light" className="text-emerald-400" />
              ) : (
                <Copy size={15} weight="light" />
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
