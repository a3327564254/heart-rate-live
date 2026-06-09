import type { HeartRatePoint } from "./types";

type MessageHandler = {
  onHeartRate?: (point: HeartRatePoint) => void;
  onViewerCount?: (count: number) => void;
  onHostStatus?: (connected: boolean) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
};

export class HeartRateWSClient {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler = {};
  private roomId: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(roomId: string = "default") {
    this.roomId = roomId;
  }

  /**
   * 作为主机连接 (发送心率数据)
   */
  connectAsHost(handlers: MessageHandler): void {
    this.handlers = handlers;
    this.connect("host");
  }

  /**
   * 作为观众连接 (接收心率数据)
   */
  connectAsViewer(handlers: MessageHandler): void {
    this.handlers = handlers;
    this.connect("viewer");
  }

  private connect(role: "host" | "viewer"): void {
    let wsUrl: string;

    // 优先使用环境变量配置的 WebSocket 地址
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST;
    if (wsHost) {
      wsUrl = `wss://${wsHost}`;
    } else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      // 本地开发
      wsUrl = `ws://${window.location.hostname}:8080`;
    } else {
      // 生产环境: 假设 WebSocket 在同一域名的不同端口或子域
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.hostname}:8080`;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // 发送加入消息
      this.send({
        type: role === "host" ? "host:join" : "viewer:join",
        roomId: this.roomId,
      });
      this.handlers.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "heart-rate":
            this.handlers.onHeartRate?.({
              bpm: msg.bpm,
              timestamp: msg.timestamp,
            });
            break;
          case "viewer:count":
            this.handlers.onViewerCount?.(msg.count);
            break;
          case "host:status":
            this.handlers.onHostStatus?.(msg.connected);
            break;
          case "error":
            this.handlers.onError?.(msg.message);
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.handlers.onDisconnect?.();
      this.tryReconnect(role);
    };

    this.ws.onerror = () => {
      this.handlers.onError?.("连接失败");
    };
  }

  private tryReconnect(role: "host" | "viewer"): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => this.connect(role), delay);
  }

  /**
   * 发送心率数据 (仅主机使用)
   */
  sendHeartRate(bpm: number): void {
    this.send({
      type: "heart-rate",
      bpm,
      timestamp: Date.now(),
    });
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.maxReconnectAttempts = 0; // 阻止重连
    this.ws?.close();
    this.ws = null;
  }
}
