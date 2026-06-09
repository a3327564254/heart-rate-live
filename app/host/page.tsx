"use client";

import { useState, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Warning } from "@phosphor-icons/react";
import { HeartRateDisplay } from "@/components/HeartRateDisplay";
import { HostControls } from "@/components/HostControls";
import { connectToHeartRateDevice, isWebBluetoothAvailable } from "@/lib/bluetooth";
import { HeartRateWSClient } from "@/lib/websocket";
import type { HeartRatePoint } from "@/lib/types";

export default function HostPage() {
  const [bpm, setBpm] = useState(0);
  const [history, setHistory] = useState<HeartRatePoint[]>([]);
  const [bleStatus, setBleStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const wsClientRef = useRef<HeartRateWSClient | null>(null);
  const bleConnectionRef = useRef<Awaited<ReturnType<typeof connectToHeartRateDevice>> | null>(null);

  const handleConnect = useCallback(async () => {
    setError(null);

    if (!isWebBluetoothAvailable()) {
      setError("此浏览器不支持 Web Bluetooth，请使用 Chrome 或 Edge");
      return;
    }

    setWsStatus("connecting");
    const wsClient = new HeartRateWSClient("default");
    wsClientRef.current = wsClient;

    wsClient.connectAsHost({
      onConnect: () => setWsStatus("connected"),
      onDisconnect: () => setWsStatus("disconnected"),
      onViewerCount: setViewerCount,
      onError: (msg) => setError(msg),
    });

    setBleStatus("connecting");
    try {
      const connection = await connectToHeartRateDevice(
        (data) => {
          setBpm(data.bpm);
          setHistory((prev) => {
            const next = [...prev, { bpm: data.bpm, timestamp: Date.now() }];
            return next.slice(-120);
          });
          wsClient.sendHeartRate(data.bpm);
        },
        () => {
          setBleStatus("disconnected");
          setError("手环已断开连接");
        }
      );
      bleConnectionRef.current = connection;
      setBleStatus("connected");
    } catch (err) {
      setBleStatus("disconnected");
      setError(err instanceof Error ? err.message : "连接手环失败");
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    bleConnectionRef.current?.disconnect();
    bleConnectionRef.current = null;
    wsClientRef.current?.disconnect();
    wsClientRef.current = null;
    setBleStatus("disconnected");
    setWsStatus("disconnected");
    setBpm(0);
    setHistory([]);
    setViewerCount(0);
  }, []);

  return (
    <main className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col items-center justify-center px-4 py-6 safe-area">
      {/* 背景 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/5 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-md flex-1 justify-center">
        {/* 标题 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <h1 className="text-lg font-medium tracking-tight">主机模式</h1>
          <p className="text-xs text-zinc-500 mt-1">连接手环，广播心率</p>
        </motion.div>

        {/* 心率 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={bleStatus === "connected"} />
        </motion.div>

        {/* 错误 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20
                       flex items-start gap-2"
          >
            <Warning size={14} className="text-red-400 mt-0.5 shrink-0" weight="light" />
            <span className="text-xs text-red-400 leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* 控制 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <HostControls
            bleStatus={bleStatus}
            wsStatus={wsStatus}
            viewerCount={viewerCount}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </motion.div>
      </div>
    </main>
  );
}
