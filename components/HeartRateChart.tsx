"use client";

import { useMemo } from "react";
import { Pulse } from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { HeartRatePoint } from "@/lib/types";

interface HeartRateChartProps {
  data: HeartRatePoint[];
  maxPoints?: number;
}

export function HeartRateChart({ data, maxPoints = 60 }: HeartRateChartProps) {
  const chartData = useMemo(() => {
    return data.slice(-maxPoints).map((point, i) => ({
      index: i,
      bpm: point.bpm,
      time: new Date(point.timestamp).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }));
  }, [data, maxPoints]);

  const { minBpm, maxBpm } = useMemo(() => {
    if (chartData.length === 0) return { minBpm: 40, maxBpm: 200 };
    const bpms = chartData.map((d) => d.bpm);
    return {
      minBpm: Math.max(40, Math.min(...bpms) - 20),
      maxBpm: Math.min(220, Math.max(...bpms) + 20),
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-28 flex flex-col items-center justify-center gap-1.5">
        <Pulse size={16} weight="light" style={{ color: "var(--text-tertiary)" }} />
        <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>暂无数据</span>
      </div>
    );
  }

  return (
    <div className="w-full h-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "var(--text-tertiary)", fontSize: 8, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minBpm, maxBpm]}
            tick={{ fill: "var(--text-tertiary)", fontSize: 8, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "10px",
              fontFamily: "monospace",
              padding: "4px 8px",
            }}
            labelStyle={{ color: "var(--text-tertiary)", fontSize: "9px" }}
            formatter={(value) => [`${value} BPM`]}
          />
          <Area
            type="monotone"
            dataKey="bpm"
            stroke="var(--accent)"
            strokeWidth={1.5}
            fill="url(#hrGrad)"
            dot={false}
            activeDot={{ r: 2.5, fill: "var(--accent)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
