from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth_deps import supabase_user_id
from app.config import supabase_admin
from app.websocket_manager import manager

router = APIRouter()

db = supabase_admin


class JoinRequestBody(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    jersey_number: int = Field(..., ge=1, le=99)
    role: str  # Batsman, Bowler, All-Rounder, WK
    message: str | None = Field(default=None, max_length=500)


ALLOWED_ROLES = {"Batsman", "Bowler", "All-Rounder", "WK"}
DEFAULT_TEAM_ID = 1


def _normalize_role(role: str) -> str:
    r = role.strip()
    mapping = {
        "batsman": "Batsman",
        "bowler": "Bowler",
        "all-rounder": "All-Rounder",
        "all rounder": "All-Rounder",
        "wk": "WK",
        "wicketkeeper": "WK",
        "wicket-keeper": "WK",
    }
    key = r.lower()
    if key in mapping:
        return mapping[key]
    if r in ALLOWED_ROLES:
        return r
    raise HTTPException(status_code=400, detail="Invalid role. Use Batsman, Bowler, All-Rounder, or WK.")


def _get_player_for_user(user_id: str) -> dict[str, Any] | None:
    res = db.table("players").select("*").eq("auth_id", user_id).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else None


def _get_pending_request(user_id: str) -> dict[str, Any] | None:
    res = (
        db.table("join_requests")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def _is_captain_or_admin(player: dict[str, Any] | None) -> bool:
    if not player:
        return False
    if player.get("status") != "Active":
        return False
    return bool(player.get("is_captain") or player.get("is_admin"))


@router.get("/me")
async def team_me(user_id: Annotated[str, Depends(supabase_user_id)]):
    """Who am I in the squad (if approved) and any pending join request."""
    player = _get_player_for_user(user_id)
    pending = _get_pending_request(user_id)
    return {
        "user_id": user_id,
        "player": player,
        "pending_request": pending,
        "is_captain": _is_captain_or_admin(player),
        "can_use_app": bool(player and player.get("status") == "Active"),
    }


@router.post("/join-request")
async def create_join_request(user_id: Annotated[str, Depends(supabase_user_id)], body: JoinRequestBody):
    role = _normalize_role(body.role)
    existing_player = _get_player_for_user(user_id)
    if existing_player and existing_player.get("status") == "Active":
        raise HTTPException(status_code=400, detail="You are already an active squad member")

    if _get_pending_request(user_id):
        raise HTTPException(status_code=400, detail="You already have a pending request")

    jersey_check = db.table("players").select("id").eq("jersey_number", body.jersey_number).execute()
    if jersey_check.data:
        raise HTTPException(status_code=409, detail="That jersey number is already taken")

    row = {
        "team_id": DEFAULT_TEAM_ID,
        "user_id": user_id,
        "full_name": body.full_name.strip(),
        "jersey_number": body.jersey_number,
        "role": role,
        "message": body.message.strip() if body.message else None,
        "status": "pending",
    }
    ins = db.table("join_requests").insert(row).execute()
    if not ins.data:
        raise HTTPException(status_code=500, detail="Could not create join request")
    await manager.broadcast("JOIN_REQUEST_CREATED", ins.data[0], room="global")
    return ins.data[0]


@router.get("/join-requests")
async def list_pending_join_requests(user_id: Annotated[str, Depends(supabase_user_id)]):
    player = _get_player_for_user(user_id)
    if not _is_captain_or_admin(player):
        raise HTTPException(status_code=403, detail="Only captain or admin can view join requests")

    res = (
        db.table("join_requests")
        .select("*")
        .eq("team_id", DEFAULT_TEAM_ID)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.post("/join-requests/{request_id}/approve")
async def approve_join_request(request_id: str, user_id: Annotated[str, Depends(supabase_user_id)]):
    captain = _get_player_for_user(user_id)
    if not _is_captain_or_admin(captain):
        raise HTTPException(status_code=403, detail="Only captain or admin can approve requests")

    req = db.table("join_requests").select("*").eq("id", request_id).limit(1).execute()
    rows = req.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    jr = rows[0]
    if jr["status"] != "pending":
        raise HTTPException(status_code=400, detail="This request is no longer pending")

    jersey_check = db.table("players").select("id").eq("jersey_number", jr["jersey_number"]).execute()
    if jersey_check.data:
        raise HTTPException(status_code=409, detail="Jersey number is no longer available")

    existing_auth = db.table("players").select("id").eq("auth_id", jr["user_id"]).execute()
    if existing_auth.data:
        raise HTTPException(status_code=409, detail="This user already has a player profile")

    player_row = {
        "auth_id": jr["user_id"],
        "name": jr["full_name"],
        "jersey_number": jr["jersey_number"],
        "role": jr["role"],
        "status": "Active",
        "is_admin": False,
        "is_captain": False,
    }
    created = db.table("players").insert(player_row).execute()
    if not created.data:
        raise HTTPException(status_code=500, detail="Could not create player")

    now = datetime.now(timezone.utc).isoformat()
    db.table("join_requests").update({"status": "approved", "reviewed_at": now, "updated_at": now}).eq("id", request_id).execute()

    payload = {"join_request_id": request_id, "player": created.data[0]}
    await manager.broadcast("JOIN_REQUEST_APPROVED", payload, room="global")
    return payload


@router.post("/join-requests/{request_id}/reject")
async def reject_join_request(request_id: str, user_id: Annotated[str, Depends(supabase_user_id)]):
    captain = _get_player_for_user(user_id)
    if not _is_captain_or_admin(captain):
        raise HTTPException(status_code=403, detail="Only captain or admin can reject requests")

    req = db.table("join_requests").select("*").eq("id", request_id).limit(1).execute()
    rows = req.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Request not found")
    if rows[0]["status"] != "pending":
        raise HTTPException(status_code=400, detail="This request is no longer pending")

    now = datetime.now(timezone.utc).isoformat()
    db.table("join_requests").update({"status": "rejected", "reviewed_at": now, "updated_at": now}).eq("id", request_id).execute()
    await manager.broadcast("JOIN_REQUEST_REJECTED", {"join_request_id": request_id}, room="global")
    return {"ok": True, "join_request_id": request_id}
