@echo off
cd /d C:\propaganda\backend
call C:\Users\user\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000