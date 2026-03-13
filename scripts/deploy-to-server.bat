@echo off
cd /d "%~dp0.."

set "GIT=C:\Program Files\Git\bin\git.exe"
if not exist "%GIT%" set "GIT=git"

echo [1/3] Adding changes...
"%GIT%" add .
echo [2/3] Committing...
"%GIT%" commit -m "Update" 2>nul
if errorlevel 1 (
  echo No changes to commit.
) else (
  echo Committed.
)
echo [3/3] Pushing to GitHub...
"%GIT%" push origin main
echo.
if errorlevel 1 (
  echo Push failed. Check login or run manually in Git Bash.
) else (
  echo Done. Vercel will auto-deploy in 1-2 min.
)
pause
