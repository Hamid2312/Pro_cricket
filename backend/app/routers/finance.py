from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import supabase
from app.websocket_manager import manager
from typing import Optional

router = APIRouter()

class LedgerEntryCreate(BaseModel):
    player_id: Optional[str] = None
    amount: int
    category: str
    status: str
    type: str # 'Income' or 'Expense'
    proof_image_url: Optional[str] = None
    month_ref: Optional[str] = None
    description: Optional[str] = None

@router.get("/ledger")
async def get_ledger():
    """Full team finance ledger."""
    return supabase.table("ledger").select("*, players(name, jersey_number)").order("created_at", desc=True).execute().data

@router.get("/balance")
async def get_balance():
    """Returns total treasury balance."""
    result = supabase.table("team_treasury").select("total_balance").eq("id", 1).single().execute()
    return {"total_balance": result.data["total_balance"] if result.data else 0}

@router.post("/ledger")
async def add_ledger_entry(entry: LedgerEntryCreate):
    result = supabase.table("ledger").insert(entry.model_dump()).execute()
    if entry.type == "Expense":
        await manager.broadcast("NEW_EXPENSE", result.data[0])
    return result.data

@router.patch("/approve/{record_id}")
async def approve_payment(record_id: str):
    result = supabase.table("ledger").update({"status": "Paid"}).eq("id", record_id).execute()
    if result.data:
        # Broadcast payment approval
        await manager.broadcast("PAYMENT_APPROVED", result.data[0])
    return result.data

@router.post("/monthly-dues")
async def trigger_monthly_dues():
    """Trigger the monthly dues function manually"""
    result = supabase.rpc("fn_monthly_dues").execute()
    await manager.broadcast("MONTHLY_DUES_GENERATED", {"status": "success"})
    return {"status": "Generated monthly dues"}
