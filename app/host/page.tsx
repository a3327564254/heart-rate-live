"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bluetooth, BluetoothSlash, Broadcast, Users, Warning, ArrowLeft } from "@phosphor-icons/react";
import { HeartRateDisplay } from "@/components/HeartRateDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  useEffect(() => {
    const wsClient = new HeartRateWSClient("default");
    wsClientRef.current = wsClient;
    setWsStatus("connecting");

    wsClient.connectAsHost({
      onConnect: () => setWsStatus("connected"),
      onDisconnect: () => setWsStatus("disconnected"),
      onViewerCount: setViewerCount,
      onError: () => {
        // WebSocket 错误不显示为阻断性错误，只更新状态
        setWsStatus("disconnected");
      },
    });

    return () => wsClient.disconnect();
  }, []);

  const handleConnect = useCallback(async () => {
    setError(null);

    if (!isWebBluetoothAvailable()) {
      setError("此浏览器不支持 Web Bluetooth，请使用 Chrome");
      return;
    }

    setBleStatus("connecting");
    try {
      const connection = await connectToHeartRateDevice(
        (data) => {
          setBpm(data.bpm);
          setHistory((prev) => {
            const next = [...prev, { bpm: data.bpm, timestamp: Date.now() }];
            return next.slice(-120);
          });
          wsClientRef.current?.sendHeartRate(data.bpm);
        },
        () => {
          setBleStatus("disconnected");
          setBpm(0);
        }
      );
      bleConnectionRef.current = connection;
      setBleStatus("connected");
      setError(null); // 连接成功，清除错误
    } catch (err) {
      setBleStatus("disconnected");
      const msg = err instanceof Error ? err.message : "蓝牙连接失败";
      // 过滤掉用户取消选择的提示
      if (msg !== "User cancelled the requestDevice() chooser.") {
        setError(msg);
      }
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    bleConnectionRef.current?.disconnect();
    bleConnectionRef.current = null;
    setBleStatus("disconnected");
    setBpm(0);
    setHistory([]);
  }, []);

  const isConnected = bleStatus === "connected";

  return (
    <main className="min-h-[100dvh] flex flex-col safe-area"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-5 py-3.5">
        <a href="/" className="flex items-center gap-1 transition-colors"
          style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={14} weight="bold" />
          <span className="text-[11px] font-mono">返回</span>
        </a>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md"
            style={{ background: isConnected ? "var(--accent-bg)" : "var(--bg-secondary)" }}>
            <Broadcast size={11} weight="fill" style={{ color: isConnected ? "var(--accent)" : "var(--text-tertiary)" }} />
            <span className="text-[10px] font-mono"
              style={{ color: isConnected ? "var(--accent)" : "var(--text-tertiary)" }}>
              {isConnected ? "广播中" : "未广播"}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md"
            style={{ background: "var(--bg-secondary)" }}>
            <Users size={11} weight="light" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {viewerCount} 人
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        {/* 蓝牙状态 */}
        <div className="mb-3 flex items-center gap-1.5">
          <Bluetooth size={13} weight="bold"
            style={{ color: bleStatus === "connected" ? "#3b82f6" : bleStatus === "connecting" ? "#f59e0b" : "var(--text-tertiary)" }} />
          <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
            {bleStatus === "connected" ? "手环已连接" : bleStatus === "connecting" ? "连接中..." : "手环未连接"}
          </span>
        </div>

        {/* 心率显示 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={isConnected} />
        </motion.div>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-xs p-2.5 rounded-lg flex items-start gap-1.5"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <Warning size={12} className="text-red-500 mt-0.5 shrink-0" weight="bold" />
            <span className="text-[11px] text-red-500 font-mono">{error}</span>
          </motion.div>
        )}

        {/* 连接按钮 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6 w-full max-w-xs"
        >
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={bleStatus === "connecting"}
              className="w-full py-3.5 rounded-xl text-white font-mono text-xs font-medium
                         active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-opacity duration-100 flex items-center justify-center gap-1.5"
              style={{ background: "#2563eb" }}
            >
              <Bluetooth size={14} weight="bold" />
              {bleStatus === "connecting" ? "连接中..." : "连接手环"}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="w-full py-3.5 rounded-xl font-mono text-xs font-medium
                         active:opacity-80 transition-opacity duration-100
                         flex items-center justify-center gap-1.5"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              <BluetoothSlash size={14} weight="bold" />
              断开连接
            </button>
          )}
        </motion.div>
      </div>

      {/* 底部说明 */}
      <div className="px-5 pb-5">
        <div className="p-3 rounded-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] font-mono mb-2" style={{ color: "var(--text-tertiary)" }}>使用说明</div>
          <div className="space-y-1.5">
            {["开启手环心率广播", "点击上方按钮连接", "连接成功自动广播", "分享页面给观众"].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
