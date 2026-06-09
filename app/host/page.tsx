"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bluetooth, BluetoothSlash, Broadcast, Users, Warning, ArrowLeft } from "@phosphor-icons/react";
import { HeartRateDisplay } from "@/components/HeartRateDisplay";
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
      onError: (msg) => setError(msg),
    });

    return () => wsClient.disconnect();
  }, []);

  const handleConnect = useCallback(async () => {
    setError(null);

    if (!isWebBluetoothAvailable()) {
      setError("浏览器不支持 Web Bluetooth，请使用 Chrome");
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
    } catch (err) {
      setBleStatus("disconnected");
      setError(err instanceof Error ? err.message : "连接失败");
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
    <main className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col safe-area">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-5 py-3.5">
        <a href="/" className="flex items-center gap-1 text-zinc-500 active:text-zinc-300 transition-colors">
          <ArrowLeft size={14} weight="bold" />
          <span className="text-[11px] font-mono">BACK</span>
        </a>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
            isConnected ? "bg-rose-500/10" : "bg-zinc-900/50"
          }`}>
            <Broadcast size={11} weight="fill" className={isConnected ? "text-rose-500" : "text-zinc-600"} />
            <span className={`text-[10px] font-mono ${isConnected ? "text-rose-400" : "text-zinc-600"}`}>
              {isConnected ? "ON AIR" : "OFF"}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900/50">
            <Users size={11} weight="light" className="text-zinc-600" />
            <span className="text-[10px] text-zinc-500 font-mono tabular-nums">{viewerCount}</span>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-4">
        {/* 蓝牙状态 */}
        <div className="mb-3 flex items-center gap-1.5">
          <Bluetooth size={13} weight="bold" className={
            bleStatus === "connected" ? "text-blue-400" :
            bleStatus === "connecting" ? "text-amber-400" : "text-zinc-600"
          } />
          <span className="text-[10px] text-zinc-500 font-mono">
            {bleStatus === "connected" ? "BAND CONNECTED" :
             bleStatus === "connecting" ? "CONNECTING..." : "BAND DISCONNECTED"}
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
            className="mt-4 w-full max-w-xs p-2.5 rounded-lg bg-red-500/8 border border-red-500/15
                       flex items-start gap-1.5"
          >
            <Warning size={12} className="text-red-400 mt-0.5 shrink-0" weight="bold" />
            <span className="text-[11px] text-red-400 font-mono">{error}</span>
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
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-mono text-xs font-medium
                         active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors duration-100 flex items-center justify-center gap-1.5"
            >
              <Bluetooth size={14} weight="bold" />
              {bleStatus === "connecting" ? "CONNECTING..." : "CONNECT BAND"}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="w-full py-3.5 rounded-xl bg-zinc-800 text-zinc-300 font-mono text-xs font-medium
                         active:bg-zinc-700 transition-colors duration-100
                         flex items-center justify-center gap-1.5"
            >
              <BluetoothSlash size={14} weight="bold" />
              DISCONNECT
            </button>
          )}
        </motion.div>
      </div>

      {/* 底部说明 */}
      <div className="px-5 pb-5">
        <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/30">
          <div className="text-[10px] text-zinc-500 font-mono mb-2">HOW TO USE</div>
          <div className="space-y-1">
            {["开启手环心率广播", "点击上方按钮连接", "连接成功自动广播", "分享页面给观众"].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[11px] text-zinc-500">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
