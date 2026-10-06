@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BKK Property Launcher

rem 1) บริการโมเดล ML (FastAPI)
start "ML Service" /min cmd /c ".venv\Scripts\python.exe -m uvicorn ml_service.main:app --host 127.0.0.1 --port 8000"

rem 2) build หน้าเว็บ (ครั้งแรกครั้งเดียว)
if not exist dist\index.html call npm run build

rem 3) เว็บเซิร์ฟเวอร์ (โหมด production ให้เสิร์ฟจาก dist)
set NODE_ENV=production
start "Web Server" /min cmd /c "npm start"

rem 4) รอจนพอร์ต 3000 พร้อม
:wait
powershell -nop -c "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close();exit 0}catch{exit 1}"
if errorlevel 1 (
  timeout /t 1 >nul
  goto wait
)

rem 5) เปิดเป็นหน้าต่างแอป (ถ้าไม่มี Edge ให้เปลี่ยน msedge เป็น chrome)
start "" msedge --app=http://localhost:3000 --window-size=1280,800