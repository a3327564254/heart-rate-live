"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Users, Pulse, ArrowRight, WifiHigh, WifiSlash } from "@phosphor-icons/react";
import { HeartRateDisplay } from "@/components/HeartRateDisplay";
import { HeartRateChart } from "@/components/HeartRateChart";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <main className="min-h-[100dvh] flex flex-col safe-area"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          {wsStatus === "connected" ? (
            <WifiHigh size={13} weight="fill" className="text-emerald-500" />
          ) : (
            <WifiSlash size={13} weight="fill" style={{ color: "var(--text-tertiary)" }} />
          )}
          <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>
            {isLive ? "直播中" : wsStatus === "connected" ? "已连接" : "连接中..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Users size={12} weight="light" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {viewerCount} 人
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={isLive} />
        </motion.div>

        {/* 等待状态 */}
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
            <span className="text-[11px] text-amber-500/70 font-mono">等待主播连接</span>
          </motion.div>
        )}
      </div>

      {/* 底部数据区 */}
      <div className="px-5 pb-5 space-y-3">
        {/* 统计卡片 */}
        {bpmRange && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-3 gap-1.5"
          >
            <StatCard label="最低" value={bpmRange.min} />
            <StatCard label="平均" value={bpmRange.avg} highlight />
            <StatCard label="最高" value={bpmRange.max} />
          </motion.div>
        )}

        {/* 心率曲线 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="p-3.5 rounded-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>心率曲线</span>
            <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {history.length > 0 ? `${history.length} 个数据点` : "暂无数据"}
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
            className="inline-flex items-center gap-1 text-[11px] font-mono py-2 px-3 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)", background: "var(--bg-secondary)" }}
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
    <div
      className="py-2.5 px-2 rounded-lg text-center"
      style={{
        background: highlight ? "var(--accent-bg)" : "var(--bg-secondary)",
        border: `1px solid ${highlight ? "var(--accent-border)" : "var(--border)"}`,
      }}
    >
      <div className="text-[10px] font-mono mb-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</div>
      <div
        className="font-mono text-lg font-bold tabular-nums"
        style={{ color: highlight ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </div>
      <div className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>BPM</div>
    </div>
  );
}
