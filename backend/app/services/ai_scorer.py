import io
import json
import logging
import pdfplumber
import fitz  # PyMuPDF
import google.generativeai as genai
from app.config import GEMINI_API_KEY, supabase

genai.configure(api_key=GEMINI_API_KEY)
logger = logging.getLogger("uvicorn.error")

class PDFStatExtractor:
    @staticmethod
    def extract_text(pdf_bytes: bytes) -> str:
        """Extract text with pdfplumber, fallback to PyMuPDF if fails."""
        raw_text = ""
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        raw_text += text + "\n"
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}. Falling back to PyMuPDF.")
            try:
                doc = fitz.open("pdf", pdf_bytes)
                for page in doc:
                    raw_text += page.get_text() + "\n"
            except Exception as inner_e:
                logger.error(f"PyMuPDF fallback failed: {inner_e}")
        return raw_text

    @staticmethod
    async def process_scorecard(pdf_bytes: bytes) -> list[dict]:
        """Extract stats and match with roster using Gemini."""
        raw_text = PDFStatExtractor.extract_text(pdf_bytes)
        
        # Get team roster for exact matching
        players_resp = supabase.table("players").select("id, name").execute()
        players = players_resp.data
        roster_str = "\n".join([f"- ID: {p['id']} | Name: {p['name']}" for p in players])

        prompt = f"""
You are a highly accurate cricket scorecard parser for the tape-ball team 'Hafiz Stars Eleven'.
Extract batting and bowling stats from this raw text. 
CRITICAL: Map player names (even if slightly misspelled or using nicknames) to the OFFICIAL ROSTER below.
Ignore players that do not match the roster.

OFFICIAL ROSTER:
{roster_str}

SCORECARD TEXT:
{raw_text}

Return ONLY a valid JSON array of objects. No markdown, no explanation.
Format of each object:
{{
  "player_id": "<exact uuid from roster, or null if unknown>",
  "player_name": "<name found in scorecard>",
  "runs": <int, default 0>,
  "balls": <int, default 0>,
  "wickets": <int, default 0>,
  "overs": <float, default 0.0>
}}
"""
        model = genai.GenerativeModel("gemini-1.5-flash")
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean potential markdown
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```"): lines = lines[1:]
                if lines[-1].startswith("```"): lines = lines[:-1]
                text = "\n".join(lines)
                
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini AI extraction failed: {e}")
            raise Exception("Failed to extract stats from the PDF using AI.")
