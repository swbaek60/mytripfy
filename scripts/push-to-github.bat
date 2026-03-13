@echo off
cd /d "%~dp0.."

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git not found. Install from https://git-scm.com/download/win
  pause
  exit /b 1
)

if not exist .git (
  echo Initializing git...
  git init
)
git add .
git status
echo.
echo Creating first commit...
git commit -m "Initial commit"
git branch -M main

echo.
echo Enter your GitHub username (e.g. swbae):
set /p GITHUB_USER=

if "%GITHUB_USER%"=="" (
  echo No username. Run these yourself - replace YOUR_USER with your GitHub id:
  echo   git remote add origin https://github.com/YOUR_USER/mytripfy.git
  echo   git push -u origin main
  pause
  exit /b 0
)

git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/mytripfy.git
echo Pushing to GitHub...
git push -u origin main

echo.
echo Done. Check https://github.com/%GITHUB_USER%/mytripfy
pause
