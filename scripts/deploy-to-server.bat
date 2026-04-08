@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."

set "GIT=C:\Program Files\Git\bin\git.exe"
if not exist "%GIT%" set "GIT=git"

REM 선택: scripts\deploy.local.bat 에 PAT 설정 시 토큰으로 푸시 (저장소에 커밋되지 않음)
if exist "%~dp0deploy.local.bat" (
  call "%~dp0deploy.local.bat"
  echo [info] deploy.local.bat loaded.
) else (
  echo [info] No deploy.local.bat — using saved Git credentials ^(git push origin^).
  echo       Token push: copy deploy.local.example.bat to deploy.local.bat and set PAT.
)

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

if defined DEPLOY_GITHUB_PAT (
  if not defined DEPLOY_GITHUB_USER set "DEPLOY_GITHUB_USER=swbaek60"
  "%GIT%" push "https://!DEPLOY_GITHUB_USER!:!DEPLOY_GITHUB_PAT!@github.com/swbaek60/mytripfy.git" HEAD:main
) else (
  "%GIT%" push origin main
)

set "DEPLOY_GITHUB_PAT="
echo.
if errorlevel 1 (
  echo Push failed. Check PAT in deploy.local.bat or Git login.
) else (
  echo Done. Vercel will auto-deploy in 1-2 min.
)
pause
endlocal
