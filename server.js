const { WebSocketServer, WebSocket } = require('ws');

const PORT = parseInt(process.env.PORT || '8080', 10);
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { host: null, viewers: new Set() });
  }
  return rooms.get(roomId);
}

function broadcastViewerCount(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify({ type: 'viewer:count', count: room.viewers.size });
  room.viewers.forEach(viewer => {
    if (viewer.readyState === WebSocket.OPEN) viewer.send(msg);
  });
  if (room.host?.readyState === WebSocket.OPEN) room.host.send(msg);
}

function broadcastHostStatus(roomId, connected) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify({ type: 'host:status', connected });
  room.viewers.forEach(viewer => {
    if (viewer.readyState === WebSocket.OPEN) viewer.send(msg);
  });
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let role = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'host:join': {
          const roomId = msg.roomId || 'default';
          const room = getRoom(roomId);
          if (room.host && room.host !== ws) {
            room.host.send(JSON.stringify({ type: 'error', message: '被新主机替换' }));
            room.host.close();
          }
          room.host = ws;
          currentRoomId = roomId;
          role = 'host';
          broadcastViewerCount(roomId);
          broadcastHostStatus(roomId, true);
          break;
        }

        case 'viewer:join': {
          const roomId = msg.roomId || 'default';
          const room = getRoom(roomId);
          room.viewers.add(ws);
          currentRoomId = roomId;
          role = 'viewer';
          broadcastViewerCount(roomId);
          if (room.host?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'host:status', connected: true }));
          } else {
            ws.send(JSON.stringify({ type: 'host:status', connected: false }));
          }
          break;
        }

        case 'heart-rate': {
          if (role !== 'host' || !currentRoomId) break;
          const room = rooms.get(currentRoomId);
          if (!room) break;
          const heartRateMsg = JSON.stringify({
            type: 'heart-rate',
            bpm: msg.bpm,
            timestamp: msg.timestamp,
          });
          room.viewers.forEach(viewer => {
            if (viewer.readyState === WebSocket.OPEN) viewer.send(heartRateMsg);
          });
          break;
        }
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    if (role === 'host') {
      room.host = null;
      broadcastHostStatus(currentRoomId, false);
    } else if (role === 'viewer') {
      room.viewers.delete(ws);
      broadcastViewerCount(currentRoomId);
    }

    if (!room.host && room.viewers.size === 0) {
      rooms.delete(currentRoomId);
    }
  });
});

console.log(`WebSocket server running on port ${PORT}`);
