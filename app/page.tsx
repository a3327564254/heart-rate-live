"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Users, Pulse, ArrowRight, WifiHigh, WifiSlash } from "@phosphor-icons/react";
import { HeartRateDisplay } from "@/components/HeartRateDisplay";
import { HeartRateChart } from "@/components/HeartRateChart";
import { HeartRateWSClient } from "@/lib/websocket";
import type { HeartRatePoint } from "@/lib/types";

export default function ViewerPage() {
  const [bpm, setBpm] = useState(0);
  const [history, setHistory] = useState<HeartRatePoint[]>([]);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [hostConnected, setHostConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [bpmRange, setBpmRange] = useState<{ min: number; max: number; avg: number } | null>(null);
  const wsClientRef = useRef<HeartRateWSClient | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const wsClient = new HeartRateWSClient("default");
    wsClientRef.current = wsClient;
    setWsStatus("connecting");

    wsClient.connectAsViewer({
      onConnect: () => setWsStatus("connected"),
      onDisconnect: () => {
        setWsStatus("disconnected");
        setHostConnected(false);
      },
      onHeartRate: (point) => {
        setBpm(point.bpm);
        setHistory((prev) => {
          const next = [...prev, point];
          const bpms = next.map((p) => p.bpm);
          setBpmRange({
            min: Math.min(...bpms),
            max: Math.max(...bpms),
            avg: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
          });
          return next.slice(-120);
        });
      },
      onHostStatus: setHostConnected,
      onViewerCount: setViewerCount,
    });

    return () => wsClient.disconnect();
  }, []);

  const isLive = wsStatus === "connected" && hostConnected;

  return (
    <main className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col safe-area">
      {/* 顶部状态栏 - 单行 */}
      <header className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          {wsStatus === "connected" ? (
            <WifiHigh size={13} weight="fill" className="text-emerald-500" />
          ) : (
            <WifiSlash size={13} weight="fill" className="text-zinc-600" />
          )}
          <span className="text-[11px] text-zinc-500 font-mono">
            {isLive ? "LIVE" : wsStatus === "connected" ? "CONNECTED" : "CONNECTING"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={12} weight="light" className="text-zinc-600" />
          <span className="text-[11px] text-zinc-500 font-mono tabular-nums">{viewerCount}</span>
        </div>
      </header>

      {/* 主内容区 - 垂直居中 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={isLive} />
        </motion.div>

        {/* 等待状态 - 简洁提示 */}
        {!hostConnected && wsStatus === "connected" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-5 flex items-center gap-1.5"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Pulse size={12} weight="bold" className="text-amber-500" />
            </motion.div>
            <span className="text-[11px] text-amber-500/70 font-mono">WAITING FOR HOST</span>
          </motion.div>
        )}
      </div>

      {/* 底部数据区 */}
      <div className="px-5 pb-5 space-y-3">
        {/* 统计卡片 - 3列网格 */}
        {bpmRange && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-3 gap-1.5"
          >
            <StatCard label="MIN" value={bpmRange.min} />
            <StatCard label="AVG" value={bpmRange.avg} highlight />
            <StatCard label="MAX" value={bpmRange.max} />
          </motion.div>
        )}

        {/* 心率曲线 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/40"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-mono">HEART RATE</span>
            <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
              {history.length > 0 ? `${history.length} PTS` : "NO DATA"}
            </span>
          </div>
          <HeartRateChart data={history} />
        </motion.div>

        {/* 主机入口 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-1"
        >
          <a
            href="/host"
            className="inline-flex items-center gap-1 text-[10px] text-zinc-600 font-mono
                       py-1.5 px-3 rounded-lg bg-zinc-900/30 active:bg-zinc-800/50 transition-colors"
          >
            <span>CONNECT AS HOST</span>
            <ArrowRight size={9} weight="bold" />
          </a>
        </motion.div>
      </div>
    </main>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`py-2 px-2 rounded-lg text-center ${
      highlight
        ? "bg-rose-500/8 border border-rose-500/15"
        : "bg-zinc-900/40 border border-zinc-800/30"
    }`}>
      <div className="text-[9px] text-zinc-600 font-mono mb-0.5">{label}</div>
      <div className={`font-mono text-base font-bold tabular-nums ${
        highlight ? "text-rose-400" : "text-zinc-300"
      }`}>
        {value}
      </div>
    </div>
  );
}
