from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import supabase
from app.services.ai_scorer import PDFStatExtractor

router = APIRouter()


@router.post("/upload-stats")
async def upload_stats(match_id: str, file: UploadFile = File(...)):
    """Upload a PDF scorecard and extract stats via AI."""

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    content = await file.read()

    # FIX: correct function call
    stats_json = await PDFStatExtractor.process_scorecard(content)

    return {
        "status": "pending_approval",
        "extracted_stats": stats_json
    }


@router.post("/confirm/{match_id}")
async def confirm_stats(match_id: str, stats: list[dict]):
    """Admin confirms AI-extracted stats and writes to DB."""

    for stat in stats:
        supabase.table("match_stats").upsert({
            "match_id": match_id,
            "player_id": stat["player_id"],
            "runs": stat.get("runs", 0),
            "balls_faced": stat.get("balls", 0),
            "wickets": stat.get("wickets", 0),
            "overs_bowled": stat.get("overs", 0.0),
        }).execute()

        _update_impact_rating(stat["player_id"])

    return {"status": "committed"}


def _update_impact_rating(player_id: str):
    stats_resp = supabase.table("match_stats").select("*").eq("player_id", player_id).execute()
    rows = stats_resp.data

    if not rows:
        return

    total_runs = sum(r["runs"] for r in rows)
    total_wickets = sum(r["wickets"] for r in rows)
    matches = len(rows)

    impact = round(
        (total_runs / max(matches, 1)) * 0.6 +
        (total_wickets / max(matches, 1)) * 15 * 0.4,
        2
    )

    supabase.table("players").update({
        "impact_rating": impact
    }).eq("id", player_id).execute()