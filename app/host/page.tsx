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

  // 自动重连 WebSocket
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

    return () => {
      wsClient.disconnect();
    };
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
      // 保存连接状态
      localStorage.setItem("hr-host-connected", "true");
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
    localStorage.removeItem("hr-host-connected");
  }, []);

  const isConnected = bleStatus === "connected";

  return (
    <main className="min-h-[100dvh] bg-[#08080a] text-white flex flex-col safe-area">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-5 py-4">
        <a href="/" className="flex items-center gap-1.5 text-zinc-500 active:text-zinc-300 transition-colors">
          <ArrowLeft size={16} weight="bold" />
          <span className="text-xs">返回</span>
        </a>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            isConnected ? "bg-rose-500/10" : "bg-zinc-900/80"
          }`}>
            <Broadcast size={12} weight="fill" className={isConnected ? "text-rose-500" : "text-zinc-600"} />
            <span className={`text-[11px] ${isConnected ? "text-rose-400" : "text-zinc-500"}`}>
              {isConnected ? "广播中" : "未广播"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80">
            <Users size={12} weight="light" className="text-zinc-400" />
            <span className="text-[11px] text-zinc-400 tabular-nums">{viewerCount}</span>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-8">
        {/* 蓝牙状态 */}
        <div className="mb-4 flex items-center gap-2">
          <Bluetooth size={16} weight="bold" className={
            bleStatus === "connected" ? "text-blue-400" :
            bleStatus === "connecting" ? "text-amber-400" : "text-zinc-600"
          } />
          <span className="text-[11px] text-zinc-500">
            {bleStatus === "connected" ? "手环已连接" :
             bleStatus === "connecting" ? "连接中..." : "手环未连接"}
          </span>
        </div>

        {/* 心率显示 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartRateDisplay bpm={bpm} isLive={isConnected} />
        </motion.div>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20
                       flex items-start gap-2"
          >
            <Warning size={14} className="text-red-400 mt-0.5 shrink-0" weight="bold" />
            <span className="text-xs text-red-400 leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* 连接按钮 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 w-full max-w-xs"
        >
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={bleStatus === "connecting"}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 text-white font-medium text-sm
                         active:bg-blue-700
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors duration-150
                         flex items-center justify-center gap-2"
            >
              <Bluetooth size={18} weight="bold" />
              {bleStatus === "connecting" ? "连接中..." : "连接手环"}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="w-full py-4 px-6 rounded-2xl bg-zinc-800 text-zinc-300 font-medium text-sm
                         active:bg-zinc-700
                         transition-colors duration-150
                         flex items-center justify-center gap-2"
            >
              <BluetoothSlash size={18} weight="bold" />
              断开连接
            </button>
          )}
        </motion.div>
      </div>

      {/* 底部提示 */}
      <div className="px-5 pb-6">
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-zinc-400 font-medium">使用说明</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-zinc-500 leading-relaxed">
            <li>1. 确保手环已开启心率广播</li>
            <li>2. 点击上方按钮连接手环</li>
            <li>3. 连接成功后自动开始广播</li>
            <li>4. 分享页面给观众查看心率</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
