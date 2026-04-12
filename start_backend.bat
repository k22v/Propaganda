@echo off
cd /d C:\coding\lms-platform\backend
call venv\Scripts\activate.bat
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000