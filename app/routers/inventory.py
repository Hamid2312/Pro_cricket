from fastapi import APIRouter
from pydantic import BaseModel
from app.config import supabase
from typing import Optional

router = APIRouter()


class InventoryUpdate(BaseModel):
    fresh_balls: Optional[int] = None
    tape_rolls: Optional[int] = None
    kit_holder_id: Optional[str] = None


@router.get("/")
async def get_inventory():
    result = supabase.table("inventory").select("*, players(name)").single().execute()
    return result.data


@router.patch("/")
async def update_inventory(update: InventoryUpdate):
    payload = {k: v for k, v in update.model_dump().items() if v is not None}
    result = supabase.table("inventory").update(payload).eq("id", 1).execute()
    return result.data


@router.post("/use-ball")
async def use_ball():
    inv = supabase.table("inventory").select("fresh_balls").single().execute().data
    new_count = max(0, inv["fresh_balls"] - 1)
    supabase.table("inventory").update({"fresh_balls": new_count}).eq("id", 1).execute()
    return {"fresh_balls": new_count}
