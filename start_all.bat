@echo off
cd /d C:\propaganda
echo Starting LMS Platform...
echo.

wt --title "Backend" cmd /k "cd /d C:\propaganda\backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

wt --title "Frontend" cmd /k "cd /d C:\propaganda\frontend && C:\propaganda\node-v20.11.0-win-x64\npm.cmd run dev"

echo.
echo Both servers are starting!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000
