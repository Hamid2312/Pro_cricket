from app.config import supabase
import logging

logger = logging.getLogger("uvicorn.error")

class TreasuryService:
    @staticmethod
    def recalculate_player_impact(player_id: str):
        """
        Recalculates a player's impact score based on all their match stats.
        Formula: (avg_runs * 0.6) + (avg_wickets * 15 * 0.4)
        """
        try:
            stats_resp = supabase.table("stats").select("*").eq("player_id", player_id).eq("confirmed", True).execute()
            rows = stats_resp.data
            
            if not rows:
                return
                
            total_runs = sum(r.get("runs", 0) for r in rows)
            total_wickets = sum(r.get("wickets", 0) for r in rows)
            matches = len(rows)
            
            avg_runs = total_runs / matches
            avg_wickets = total_wickets / matches
            
            impact = round((avg_runs * 0.6) + (avg_wickets * 15 * 0.4), 2)
            
            supabase.table("players").update({"impact_rating": impact}).eq("id", player_id).execute()
            logger.info(f"Updated impact rating for player {player_id} to {impact}")
        except Exception as e:
            logger.error(f"Failed to recalculate impact rating for player {player_id}: {e}")

    @staticmethod
    def commit_match_stats(match_id: str, stats_data: list[dict]):
        """
        Commits batch stats from AI extraction, marks them confirmed, 
        and updates all affected players' impact ratings.
        """
        for stat in stats_data:
            if not stat.get("player_id"):
                continue # Skip unmatched players
                
            payload = {
                "match_id": match_id,
                "player_id": stat["player_id"],
                "runs": stat.get("runs", 0),
                "balls_faced": stat.get("balls", 0),
                "wickets": stat.get("wickets", 0),
                "overs_bowled": stat.get("overs", 0.0),
                "confirmed": True
            }
            
            # Upsert stat record
            supabase.table("stats").upsert(payload, on_conflict="match_id,player_id").execute()
            
            # Recalculate impact for this player
            TreasuryService.recalculate_player_impact(stat["player_id"])
            
        return {"status": "success", "message": "Stats committed and ratings updated."}
