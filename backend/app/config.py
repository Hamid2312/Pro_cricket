import logging
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_SERVICE_KEY:
    logger.warning(
        "Missing SUPABASE_URL, SUPABASE_KEY, or SUPABASE_SERVICE_KEY in backend/.env"
    )
if not SUPABASE_JWT_SECRET:
    logger.warning(
        "SUPABASE_JWT_SECRET missing — auth will use Supabase API only. "
        "Copy JWT Secret from Supabase Dashboard → Settings → API → JWT Settings"
    )

# FRONTEND_ORIGIN: comma-separated list of allowed CORS origins
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://localhost:5174")
ALLOWED_ORIGINS = [o.strip() for o in FRONTEND_ORIGIN.split(",") if o.strip()]

# anon client — for public reads (respects RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# service-role client — bypasses RLS; backend use ONLY, never send to browser
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
