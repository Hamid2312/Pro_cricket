from fastapi import APIRouter
from pydantic import BaseModel
from app.config import supabase
from typing import Optional

router = APIRouter()


class PlayerCreate(BaseModel):
    name: str
    jersey_number: int
    role: str          # "batsman" | "bowler" | "all-rounder" | "wk"
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/")
async def list_players():
    return supabase.table("players").select("*").order("jersey_number").execute().data


@router.get("/{player_id}")
async def get_player(player_id: str):
    result = supabase.table("players").select("*, match_stats(*)").eq("id", player_id).single().execute()
    return result.data


@router.post("/")
async def create_player(player: PlayerCreate):
    result = supabase.table("players").insert(player.model_dump()).execute()
    return result.data


@router.patch("/{player_id}")
async def update_player(player_id: str, data: dict):
    result = supabase.table("players").update(data).eq("id", player_id).execute()
    return result.data
