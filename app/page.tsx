"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Users, Pulse, ArrowRight } from "@phosphor-icons/react";
import { HeartRateDisplay } from "@/components/HeartRateDisplay";
import { HeartRateChart } from "@/components/HeartRateChart";
import { ConnectionStatus } from "@/components/ConnectionStatus";
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
    <main className="min-h-dvh bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      {/* 背景 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/5 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-md">
        {/* 顶部状态 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full flex items-center justify-between"
        >
          <ConnectionStatus status={wsStatus} label="服务器" />
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Users size={13} weight="light" />
            <span className="text-xs">{viewerCount}</span>
          </div>
        </motion.div>

        {/* 心率显示 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={isLive} />
        </motion.div>

        {/* 等待状态 */}
        {!hostConnected && wsStatus === "connected" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-amber-500/70"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Pulse size={14} weight="light" />
            </motion.div>
            <span>等待主机连接</span>
          </motion.div>
        )}

        {/* 统计 */}
        {bpmRange && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full grid grid-cols-3 gap-2"
          >
            <StatCard label="最低" value={bpmRange.min} />
            <StatCard label="平均" value={bpmRange.avg} />
            <StatCard label="最高" value={bpmRange.max} />
          </motion.div>
        )}

        {/* 图表 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs text-zinc-400">心率曲线</h2>
            <span className="text-[10px] text-zinc-600">
              {history.length} 点
            </span>
          </div>
          <HeartRateChart data={history} />
        </motion.div>

        {/* 主机入口 */}
        <motion.a
          href="/host"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <span>作为主机连接手环</span>
          <ArrowRight size={11} weight="light" />
        </motion.a>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-3 px-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40 text-center">
      <div className="text-[10px] text-zinc-600 mb-1">{label}</div>
      <div className="font-mono text-xl font-bold text-zinc-200">{value}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5">BPM</div>
    </div>
  );
}
