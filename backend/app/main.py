from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.routers import finance, matches, stats, inventory, players
from app.websocket_manager import manager

app = FastAPI(
    title="Hafiz Stars Eleven API",
    description="Backend for Hafiz Stars Eleven Cricket Team PWA",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/players", tags=["Players"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])

@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    try:
        while True:
            # We expect a heartbeat ping {"type": "ping"} to keep connection alive
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)

@app.get("/")
async def root():
    return {"message": "Hafiz Stars Eleven API v1.0", "status": "live"}
