from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger("uvicorn.error")

class ConnectionManager:
    def __init__(self):
        # Room based connection pool: {"room_name": [websocket1, websocket2]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
        logger.info(f"Client connected to room: {room}. Total in room: {len(self.active_connections[room])}")

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections and websocket in self.active_connections[room]:
            self.active_connections[room].remove(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]
            logger.info(f"Client disconnected from room: {room}.")

    async def broadcast(self, event: str, payload: dict, room: str = "global"):
        """Broadcast an event payload to a specific room."""
        if room not in self.active_connections:
            return
            
        message = json.dumps({"event": event, "payload": payload})
        
        dead_connections = []
        for connection in self.active_connections[room]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client in room {room}: {e}")
                dead_connections.append(connection)
                
        # Cleanup dead connections
        for dead in dead_connections:
            self.disconnect(dead, room)

# Singleton instance for the entire app
manager = ConnectionManager()
