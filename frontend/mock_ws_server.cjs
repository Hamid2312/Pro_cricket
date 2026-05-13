const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8000 });
const rooms = new Map();

console.log("Mock WebSocket server started on ws://localhost:8000");

wss.on('connection', function connection(ws, req) {
  // Extract room from URL (e.g., /ws/global -> global)
  const room = req.url.split('/').pop() || 'global';
  
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room).add(ws);
  
  console.log(`Client connected to room: ${room}`);

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      console.log(`Received in ${room}:`, data.event);

      // Broadcast to everyone in the room
      const clients = rooms.get(room);
      if (clients) {
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
          }
        });
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  });

  ws.on('close', () => {
    rooms.get(room)?.delete(ws);
    console.log(`Client disconnected from room: ${room}`);
  });
});
