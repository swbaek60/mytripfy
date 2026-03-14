@echo off
chcp 65001 >nul
cd /d "%~dp0.."
node scripts/generate-sns-daily.mjs --days=7
echo.
pause
