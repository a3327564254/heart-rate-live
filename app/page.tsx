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

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const isLive = wsStatus === "connected" && hostConnected;

  return (
    <main className="min-h-[100dvh] bg-[#08080a] text-white flex flex-col safe-area">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          {wsStatus === "connected" ? (
            <WifiHigh size={14} weight="fill" className="text-emerald-500" />
          ) : (
            <WifiSlash size={14} weight="fill" className="text-zinc-600" />
          )}
          <span className="text-[11px] text-zinc-500">
            {wsStatus === "connected" ? (isLive ? "直播中" : "已连接") : "连接中..."}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80">
          <Users size={12} weight="light" className="text-zinc-400" />
          <span className="text-[11px] text-zinc-400 tabular-nums">{viewerCount}</span>
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-8">
        {/* 心率显示 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={isLive} />
        </motion.div>

        {/* 等待提示 */}
        {!hostConnected && wsStatus === "connected" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Pulse size={14} weight="bold" className="text-amber-500" />
            </motion.div>
            <span className="text-xs text-amber-500">等待主播连接手环</span>
          </motion.div>
        )}
      </div>

      {/* 底部信息区 */}
      <div className="px-5 pb-6 space-y-4">
        {/* 统计卡片 */}
        {bpmRange && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-3 gap-2"
          >
            <StatCard label="最低" value={bpmRange.min} />
            <StatCard label="平均" value={bpmRange.avg} highlight />
            <StatCard label="最高" value={bpmRange.max} />
          </motion.div>
        )}

        {/* 心率曲线 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/30"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-zinc-300">心率曲线</h2>
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {history.length > 0 ? `${history.length} 个数据点` : "暂无数据"}
            </span>
          </div>
          <HeartRateChart data={history} />
        </motion.div>

        {/* 主机入口 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a
            href="/host"
            className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 active:text-zinc-400
                       py-2 px-4 rounded-full bg-zinc-900/50 transition-colors"
          >
            <span>作为主播连接手环</span>
            <ArrowRight size={10} weight="bold" />
          </a>
        </motion.div>
      </div>
    </main>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`py-3 px-2 rounded-xl text-center ${
      highlight
        ? "bg-rose-500/10 border border-rose-500/20"
        : "bg-zinc-900/50 border border-zinc-800/30"
    }`}>
      <div className="text-[10px] text-zinc-500 mb-1">{label}</div>
      <div className={`font-mono text-xl font-bold tabular-nums ${
        highlight ? "text-rose-400" : "text-zinc-200"
      }`}>
        {value}
      </div>
      <div className="text-[10px] text-zinc-600 mt-0.5">BPM</div>
    </div>
  );
}
