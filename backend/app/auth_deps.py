import logging
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException

from app.config import SUPABASE_JWT_SECRET, supabase

logger = logging.getLogger("uvicorn.error")


def get_bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return authorization.split(" ", 1)[1].strip()


def _user_id_from_jwt(token: str) -> str | None:
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        sub = payload.get("sub")
        return str(sub) if sub else None
    except jwt.PyJWTError as exc:
        logger.warning("Local JWT verification failed: %s", exc)
        return None


def _user_id_from_supabase(token: str) -> str | None:
    """Verify token via Supabase Auth API (works when JWT secret was copied wrong)."""
    try:
        resp = supabase.auth.get_user(token)
        user = getattr(resp, "user", None) or (resp.get("user") if isinstance(resp, dict) else None)
        if user:
            uid = getattr(user, "id", None) or user.get("id")
            if uid:
                return str(uid)
    except Exception as exc:
        logger.warning("Supabase auth.get_user failed: %s", exc)
    return None


def supabase_user_id(token: Annotated[str, Depends(get_bearer_token)]) -> str:
    user_id = _user_id_from_jwt(token) or _user_id_from_supabase(token)
    if user_id:
        return user_id

    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_JWT_SECRET is missing in backend/.env — copy JWT Secret from Supabase → Settings → API",
        )
    raise HTTPException(
        status_code=401,
        detail="Invalid or expired session. Confirm backend SUPABASE_URL matches your frontend project.",
    )
