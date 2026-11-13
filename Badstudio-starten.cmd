@echo off
cd /d "%~dp0"
node _dev/start-local.cjs
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8765/konfigurator-neu/index.html"
