import { WebSocketServer, WebSocket } from "ws";

interface Room {
  host: WebSocket | null;
  viewers: Set<WebSocket>;
}

const rooms = new Map<string, Room>();

function getRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { host: null, viewers: new Set() });
  }
  return rooms.get(roomId)!;
}

function broadcastViewerCount(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify({
    type: "viewer:count",
    count: room.viewers.size,
  });
  room.viewers.forEach((viewer) => {
    if (viewer.readyState === WebSocket.OPEN) {
      viewer.send(msg);
    }
  });
  if (room.host?.readyState === WebSocket.OPEN) {
    room.host.send(msg);
  }
}

function broadcastHostStatus(roomId: string, connected: boolean): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify({ type: "host:status", connected });
  room.viewers.forEach((viewer) => {
    if (viewer.readyState === WebSocket.OPEN) {
      viewer.send(msg);
    }
  });
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let role: "host" | "viewer" | null = null;

  ws.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case "host:join": {
          const roomId = msg.roomId || "default";
          const room = getRoom(roomId);
          // 如果已有主机，断开旧主机
          if (room.host && room.host !== ws) {
            room.host.send(JSON.stringify({ type: "error", message: "被新主机替换" }));
            room.host.close();
          }
          room.host = ws;
          currentRoomId = roomId;
          role = "host";
          broadcastViewerCount(roomId);
          broadcastHostStatus(roomId, true);
          break;
        }

        case "viewer:join": {
          const roomId = msg.roomId || "default";
          const room = getRoom(roomId);
          room.viewers.add(ws);
          currentRoomId = roomId;
          role = "viewer";
          broadcastViewerCount(roomId);
          // 通知观众主机状态
          if (room.host?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "host:status", connected: true }));
          } else {
            ws.send(JSON.stringify({ type: "host:status", connected: false }));
          }
          break;
        }

        case "heart-rate": {
          if (role !== "host" || !currentRoomId) break;
          const room = rooms.get(currentRoomId);
          if (!room) break;
          // 广播给所有观众
          const heartRateMsg = JSON.stringify({
            type: "heart-rate",
            bpm: msg.bpm,
            timestamp: msg.timestamp,
          });
          room.viewers.forEach((viewer) => {
            if (viewer.readyState === WebSocket.OPEN) {
              viewer.send(heartRateMsg);
            }
          });
          break;
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on("close", () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    if (role === "host") {
      room.host = null;
      broadcastHostStatus(currentRoomId, false);
    } else if (role === "viewer") {
      room.viewers.delete(ws);
      broadcastViewerCount(currentRoomId);
    }

    // 清理空房间
    if (!room.host && room.viewers.size === 0) {
      rooms.delete(currentRoomId);
    }
  });
});

console.log("WebSocket server running on ws://localhost:8080");
