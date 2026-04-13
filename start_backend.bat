@echo off
cd /d C:\coding\lms-platform\backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000