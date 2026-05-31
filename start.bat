@echo off
cd /d "%~dp0"
echo ============================================
echo  EventPass - Levantando servicios con Docker
echo ============================================
echo.
docker compose up --build
pause
