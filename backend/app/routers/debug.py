from fastapi import APIRouter, Request
from app.config import SUPABASE_JWT_SECRET
import logging
import jwt

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


@router.get("/debug")
async def debug_headers(request: Request):
    """Temporary debug endpoint: returns Authorization header and decoded JWT (if possible)."""
    auth = request.headers.get("authorization")
    resp = {"authorization_present": bool(auth), "authorization_preview": None, "decoded": None, "error": None}
    if auth:
        try:
            token = auth.split(" ", 1)[1]
            resp["authorization_preview"] = token[:12] + "..."
        except Exception:
            resp["authorization_preview"] = "<malformed>"

    if auth and SUPABASE_JWT_SECRET:
        try:
            token = auth.split(" ", 1)[1]
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            resp["decoded"] = {"sub": payload.get("sub"), "aud": payload.get("aud"), "exp": payload.get("exp")}
        except Exception as exc:
            logger.exception("debug: token decode failed")
            resp["error"] = str(exc)

    return resp
