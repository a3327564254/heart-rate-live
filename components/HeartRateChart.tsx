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
        <Pulse size={16} weight="light" className="text-zinc-700" />
        <span className="text-[10px] text-zinc-600 font-mono">NO DATA</span>
      </div>
    );
  }

  return (
    <div className="w-full h-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "#3f3f46", fontSize: 8, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minBpm, maxBpm]}
            tick={{ fill: "#3f3f46", fontSize: 8, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              color: "#fafafa",
              fontSize: "10px",
              fontFamily: "monospace",
              padding: "4px 8px",
            }}
            labelStyle={{ color: "#52525b", fontSize: "9px" }}
            formatter={(value) => [`${value} BPM`]}
          />
          <Area
            type="monotone"
            dataKey="bpm"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="url(#hrGrad)"
            dot={false}
            activeDot={{ r: 2.5, fill: "#f43f5e", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
