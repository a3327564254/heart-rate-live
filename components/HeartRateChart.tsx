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
    const sliced = data.slice(-maxPoints);
    return sliced.map((point, i) => ({
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
      minBpm: Math.max(40, Math.min(...bpms) - 15),
      maxBpm: Math.min(220, Math.max(...bpms) + 15),
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-40 flex flex-col items-center justify-center gap-2 text-zinc-600">
        <Pulse size={20} weight="light" />
        <span className="text-xs">等待数据</span>
      </div>
    );
  }

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minBpm, maxBpm]}
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "11px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#71717a", fontSize: "10px" }}
            formatter={(value) => [`${value} BPM`]}
          />
          <Area
            type="monotone"
            dataKey="bpm"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="url(#hrGradient)"
            dot={false}
            activeDot={{ r: 3, fill: "#f43f5e", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
