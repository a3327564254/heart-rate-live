// WebSocket 消息类型
export type WSMessage =
  | { type: "host:join"; roomId: string }
  | { type: "viewer:join"; roomId: string }
  | { type: "heart-rate"; bpm: number; timestamp: number }
  | { type: "viewer:count"; count: number }
  | { type: "host:status"; connected: boolean }
  | { type: "error"; message: string };

// 心率数据点
export interface HeartRatePoint {
  bpm: number;
  timestamp: number;
}

// 连接状态
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

// BLE 心率数据解析结果
export interface HeartRateData {
  bpm: number;
  contactDetected: boolean;
  energyExpended?: number;
  rrIntervals?: number[];
}
