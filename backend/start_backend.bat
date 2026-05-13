@echo off
echo Starting Hafiz Stars Eleven Backend...
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
pause
