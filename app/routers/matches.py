from fastapi import APIRouter
from pydantic import BaseModel
from app.config import supabase
from app.websocket_manager import manager
from typing import List

router = APIRouter()

class MatchCreate(BaseModel):
    opponent: str
    venue: str
    match_date: str
    match_time: str

class RSVPUpdate(BaseModel):
    player_id: str
    status: str   # "in" | "out" | "maybe"

class XIUpdate(BaseModel):
    squad_list: List[dict] # Expected format: [{"id": "uuid", "name": "Player", ...}, ...]

@router.get("/upcoming")
async def get_upcoming():
    return supabase.table("matches").select("*").eq("is_live", False).order("match_date").execute().data

@router.get("/{match_id}")
async def get_match(match_id: str):
    result = supabase.table("matches").select("*, rsvps(*, players(name, jersey_number))").eq("id", match_id).single().execute()
    return result.data

@router.post("/")
async def create_match(match: MatchCreate):
    result = supabase.table("matches").insert(match.model_dump()).execute()
    return result.data

@router.post("/{match_id}/rsvp")
async def update_rsvp(match_id: str, rsvp: RSVPUpdate):
    existing = supabase.table("rsvps").select("id").eq("match_id", match_id).eq("player_id", rsvp.player_id).execute()
    if existing.data:
        result = supabase.table("rsvps").update({"status": rsvp.status}).eq("id", existing.data[0]["id"]).execute()
    else:
        result = supabase.table("rsvps").insert({"match_id": match_id, "player_id": rsvp.player_id, "status": rsvp.status}).execute()
    
    # Broadcast RSVP change to the specific match room
    await manager.broadcast("RSVP_CHANGED", result.data[0], room=f"match-{match_id}")
    return result.data

@router.patch("/{match_id}/xi")
async def update_playing_xi(match_id: str, xi: XIUpdate):
    # The squad_list column stores the JSON representation of the XI
    result = supabase.table("matches").update({"squad_list": xi.squad_list}).eq("id", match_id).execute()
    
    # Broadcast XI change to the specific match room
    await manager.broadcast("XI_UPDATED", result.data[0], room=f"match-{match_id}")
    return result.data
