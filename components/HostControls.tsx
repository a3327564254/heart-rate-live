"use client";

import { motion } from "motion/react";
import { Users, Link, Copy } from "@phosphor-icons/react";
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
  const isConnected = bleStatus === "connected" && wsStatus === "connected";

  return (
    <div className="w-full max-w-sm space-y-3">
      {/* 连接状态 */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 space-y-2.5">
        <ConnectionStatus status={bleStatus} label="手环" />
        <ConnectionStatus status={wsStatus} label="服务器" />
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/50">
          <Users size={14} className="text-zinc-500" weight="light" />
          <span className="text-zinc-500 text-xs">
            {viewerCount} 人观看
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      {!isConnected ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConnect}
          disabled={bleStatus === "connecting" || wsStatus === "connecting"}
          className="w-full py-3.5 px-6 rounded-2xl bg-rose-500 text-white font-medium
                     hover:bg-rose-600 active:bg-rose-700
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          {bleStatus === "connecting" || wsStatus === "connecting"
            ? "连接中..."
            : "连接手环"}
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDisconnect}
          className="w-full py-3.5 px-6 rounded-2xl bg-zinc-800 text-zinc-300 font-medium
                     hover:bg-zinc-700 active:bg-zinc-600
                     transition-colors duration-150"
        >
          断开连接
        </motion.button>
      )}

      {/* 分享链接 */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/50"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Link size={12} className="text-zinc-500" weight="light" />
            <p className="text-xs text-zinc-500">分享给观众</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-emerald-400 bg-zinc-950/80 px-3 py-2 rounded-xl overflow-x-auto font-mono">
              {typeof window !== "undefined" ? window.location.origin : ""}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
              }}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white
                         hover:bg-zinc-700 transition-colors duration-150"
              aria-label="复制链接"
            >
              <Copy size={14} weight="light" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
